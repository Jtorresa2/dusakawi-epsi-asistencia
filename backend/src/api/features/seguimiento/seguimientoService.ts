import pool from "../config/db";
import { timeToMinutes } from "./marcacionService";

/**
 * Seguimiento de Asistencia — módulo de SOLO CONSULTA (REQ-01..15).
 *
 * Clasifica cada (usuario, fecha) laboral en EXACTAMENTE una de 5 situaciones
 * (fila única), con precedencia 1→5 y de forma tramo-aware contra
 * schedule_details. Reutiliza attendances, news (SOLO status='approved'),
 * incidents y schedule_details. NO escribe nada. NO lee la columna mark_state
 * (deriva todo por timestamps, inmune a drift de esquema).
 *
 * Anti-N+1 (REQ-15): 3 consultas batch sobre la ventana — universo
 * (usuario,fecha), novedades aprobadas e incidencias vinculables — y toda la
 * clasificación se resuelve en memoria.
 */

export const SITUACION = Object.freeze({
  AUSENCIA: "absence",
  FALTA_MANANA: "missing_morning",
  FALTA_TARDE: "missing_afternoon",
  SALIDA_NO_REGISTRADA: "unregistered_exit",
  JORNADA_ABIERTA: "open_day",
});

// Incidencias formales que el módulo puede vincular a una fila (REQ-04/05/10).
// 'late' y 'biometric_failure' no generan situación propia pero sí habilitan
// "Ver en Incidencias" cuando existen para ese (usuario, fecha).
const TIPOS_INCIDENCIA_VINCULABLES = [
  "unregistered_exit",
  "afternoon_absence",
  "late",
  "biometric_failure",
];

// Tipo de incidencia formal que corresponde a cada situación (para elegir el
// vínculo más relevante cuando hay varias el mismo día).
const INCIDENCIA_POR_SITUACION: Record<string, string> = {
  [SITUACION.FALTA_TARDE]: "afternoon_absence",
  [SITUACION.SALIDA_NO_REGISTRADA]: "unregistered_exit",
};

export const PAGE_SIZE_MAX = 500;
export const PAGE_SIZE_DEFAULT = 100;

/**
 * Formatea una fecha (Date de pg o string) a 'YYYY-MM-DD' local.
 * NO usar toISOString: desplazaría el día en husos negativos.
 */
export function fmtDate(d: unknown): string {
  if (d instanceof Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  }
  return String(d).substring(0, 10);
}

/** 'YYYY-MM-DD' local de hoy (del servidor). */
export function hoyISO(): string {
  return fmtDate(new Date());
}

interface NovedadFila {
  fecha_desde: unknown;
  fecha_hasta: unknown;
  tipo: unknown;
  hora_desde: unknown;
  hora_hasta: unknown;
}

/**
 * ¿Existe una novedad APROBADA cuyo rango [date_from, date_to] cubra la
 * fecha? (REQ-02 esc. 2: cualquier tipo que cubra la fecha excluye la ausencia).
 */
export function novedadCubreFecha(novedades: NovedadFila[], fechaISO: string): boolean {
  return novedades.some(
    (n) => fmtDate(n.fecha_desde) <= fechaISO && fmtDate(n.fecha_hasta) >= fechaISO
  );
}

interface FilaUniverso {
  entrada_manana?: unknown;
  salida_manana?: unknown;
  entrada_tarde?: unknown;
  salida_tarde?: unknown;
  exp_ent_manana?: unknown;
  exp_sal_manana?: unknown;
  exp_ent_tarde?: unknown;
  exp_sal_tarde?: unknown;
  _fechaISO?: string;
}

/**
 * ¿Una novedad aprobada cubre el TRAMO indicado del horario? Espejo en memoria
 * de la semántica de `obtenerNovedadQueCubreTarde` de marcacionService (mañana
 * = espejo, día completo = cualquier tipo que cubra la fecha):
 *
 *  - 'full_day' → cubre cualquier tramo.
 *  - 'morning'/'afternoon' → cubre solo su tramo homónimo.
 *  - 'hours' → cubre solo si [time_from, time_to] solapa el tramo del
 *    horario ([morning_entry, morning_exit]).
 */
export function novedadCubreTramo(
  novedades: NovedadFila[],
  fechaISO: string,
  tramo: "morning" | "afternoon",
  fila: FilaUniverso
): boolean {
  const entrada = tramo === "morning" ? fila.exp_ent_manana : fila.exp_ent_tarde;
  const salida = tramo === "morning" ? fila.exp_sal_manana : fila.exp_sal_tarde;
  const iniTramo = entrada ? timeToMinutes(entrada) : null;
  const finTramo = salida ? timeToMinutes(salida) : null;

  return novedades.some((n) => {
    if (fmtDate(n.fecha_desde) > fechaISO || fmtDate(n.fecha_hasta) < fechaISO) return false;
    const tipo = n.tipo; // slot: full_day | hours | morning | afternoon
    if (tipo === "full_day") return true;
    if (tipo === tramo) return true;
    if (tipo === "hours") {
      if (iniTramo === null || finTramo === null) return false;
      const desde = timeToMinutes(n.hora_desde);
      const hasta = timeToMinutes(n.hora_hasta);
      if (desde === null || hasta === null) return false;
      // Solapa el tramo si [desde, hasta] toca [iniTramo, finTramo].
      return desde <= finTramo && hasta >= iniTramo;
    }
    return false;
  });
}

interface CtxClasificarFila {
  novedades?: NovedadFila[];
  hoyISO?: string;
}

/**
 * Clasifica UNA fila del universo en una situación (o null si queda excluida).
 *
 * Precedencia (REQ-01): absence(1) > missing_morning(2) > missing_afternoon(3) >
 * unregistered_exit(4) > open_day(5). Fila única por (usuario,fecha).
 *
 * Reglas de exclusión (REQ-01/02/04 + diseño):
 *  - Sin tramos reales definidos en schedule_details (día sin horario) → null.
 *  - Jornada resuelta (tramos completos, o cubiertos por novedad aprobada)
 *    → null (p.ej. solo-tarde con 2 marcas = completa; REQ-01 esc. 1).
 *  - Fechas futuras → null.
 *  - 0 marcas con novedad aprobada que cubre la fecha → null (REQ-02 esc. 2).
 *  - 0 marcas HOY → null (día en curso aún no confirmable).
 *  - Día en curso (hoy) incompleto → open_day (REQ-06).
 *  - Día pasado con marcas → precedencia estricta 1→5.
 */
export function clasificarFila(fila: FilaUniverso, ctx: CtxClasificarFila = {}): string | null {
  const ent = fila.entrada_manana;
  const salM = fila.salida_manana;
  const entT = fila.entrada_tarde;
  const salT = fila.salida_tarde;

  // Tramo(s) que el horario define para el día (requiere entrada Y salida).
  const hasManana = Boolean(fila.exp_ent_manana && fila.exp_sal_manana);
  const hasTarde = Boolean(fila.exp_ent_tarde && fila.exp_sal_tarde);
  if (!hasManana && !hasTarde) return null; // día sin horario real → excluido

  const fecha = fila._fechaISO;
  if (!fecha) return null;
  const hoy = ctx.hoyISO;
  const novedades = ctx.novedades || [];

  // Pares de marca cerrados (columnas reales). En horarios de UN tramo las
  // marcas pueden quedar en el par mañana (secuencia 1→2 del procesador) o en
  // el par tarde (carga semántica) — cualquiera de los dos cierra la jornada.
  const parManana = Boolean(ent && salM);
  const parTarde = Boolean(entT && salT);
  const cubreManana = novedadCubreTramo(novedades, fecha, "morning", fila);
  const cubreTarde = novedadCubreTramo(novedades, fecha, "afternoon", fila);

  // Jornada resuelta: cada tramo definido quedó marcado o cubierto por novedad
  // aprobada. Una jornada resuelta NO aparece en la lista (REQ-01, REQ-04 esc.2).
  let completa;
  if (hasManana && hasTarde) {
    completa = (parManana || cubreManana) && (parTarde || cubreTarde);
  } else {
    completa = parManana || parTarde || (hasManana ? cubreManana : cubreTarde);
  }
  if (completa) return null;

  if (hoy && fecha > hoy) return null; // futuro: nada que reportar

  const algunaMarca = Boolean(ent || salM || entT || salT);

  // (1) Ausencia de día completo: 0 marcas en día laboral (REQ-02).
  if (!algunaMarca) {
    if (novedadCubreFecha(novedades, fecha)) return null; // esc. 2: cubierta
    if (fecha === hoy) return null; // hoy aún puede marcar → no confirmable
    return SITUACION.AUSENCIA;
  }

  // Día en curso con marcas incompletas → open_day (REQ-06).
  if (fecha === hoy) return SITUACION.JORNADA_ABIERTA;

  // ── Día pasado con marcas: precedencia estricta 1→5 ──────────────────
  // (2) Falta de marcación — Mañana (REQ-03): tramo mañana definido, sin
  // entrada, con ≥1 marca y sin novedad aprobada que cubra la mañana.
  if (hasManana && !ent) {
    if (!cubreManana) return SITUACION.FALTA_MANANA;
    // Mañana justificada → continúa: solo puede quedar un problema real del
    // tramo de tarde (p.ej. salida no registrada) más abajo.
  }
  // (3) Falta de marcación — Tarde (REQ-04): tramo tarde definido, mañana
  // cerrada (entrada + salida mañana), sin entrada de tarde y sin novedad
  // aprobada que cubra la tarde.
  if (hasTarde && ent && salM && !entT) {
    if (!cubreTarde) return SITUACION.FALTA_TARDE;
    return null; // tarde justificada → excluido (REQ-04 esc. 2)
  }
  // (4) Salida no registrada (REQ-05): entrada de un tramo real sin su salida.
  const tramoAbierto = (ent && !salM) || (entT && !salT);
  if (tramoAbierto) return SITUACION.SALIDA_NO_REGISTRADA;
  // (5) Jornada abierta (REQ-06): incompleta que no calzó 1-4 (residual).
  return SITUACION.JORNADA_ABIERTA;
}

/**
 * Consulta A — universo (usuario, fecha) de la ventana: generate_series ×
 * usuarios activos con horario, LEFT JOIN attendances + schedule_details
 * tramo-aware + exclusión de festivos y modalidades flexible/by_hours
 * (REQ-01 esc. flexible) y días sin horario (descanso).
 *
 * Filtros aplicados aquí: fecha (rango), area (LIKE nombre), piso y busqueda
 * (nombre/apellido/cédula). El filtro de situación se aplica en memoria porque
 * la situación se deriva por clasificación, no en SQL.
 */
async function consultarUniverso(filtros: SeguimientoFiltros) {
  const params: unknown[] = [filtros.fecha_desde, filtros.fecha_hasta];
  let sql = `
    SELECT u.id AS usuario_id, dd.document_number AS cedula,
      CONCAT(u.first_name, ' ', u.first_surname) AS empleado,
      ar.name AS area,
      NULLIF(regexp_replace(fl.name, '\\D', '', 'g'), '')::int AS piso,
      d.fecha::text AS fecha,   -- día civil 'YYYY-MM-DD' (sin desplazamiento de zona)
      TO_CHAR(a.entry_timestamp, 'HH24:MI') AS entrada_manana,
      TO_CHAR(a.morning_departure_timestamp, 'HH24:MI') AS salida_manana,
      TO_CHAR(a.afternoon_entry_timestamp, 'HH24:MI') AS entrada_tarde,
      TO_CHAR(a.departure_timestamp, 'HH24:MI') AS salida_tarde,
      TO_CHAR(hd.morning_entry, 'HH24:MI') AS exp_ent_manana,
      TO_CHAR(hd.morning_exit, 'HH24:MI') AS exp_sal_manana,
      TO_CHAR(hd.afternoon_entry, 'HH24:MI') AS exp_ent_tarde,
      TO_CHAR(hd.afternoon_exit, 'HH24:MI') AS exp_sal_tarde
    FROM generate_series($1::date, $2::date, '1 day') AS d(fecha)
    JOIN users u ON u.active = true AND u.schedule_id IS NOT NULL
    LEFT JOIN document_details dd ON dd.user_id = u.id
    JOIN areas ar ON u.area_id = ar.id
    LEFT JOIN floors fl ON ar.floor_id = fl.id
    LEFT JOIN schedules h ON u.schedule_id = h.id
    LEFT JOIN schedule_details hd ON hd.schedule_id = u.schedule_id
      AND hd.day_of_week = CASE EXTRACT(DOW FROM d.fecha)
          WHEN 0 THEN 'Domingo' WHEN 1 THEN 'Lunes' WHEN 2 THEN 'Martes'
          WHEN 3 THEN 'Miércoles' WHEN 4 THEN 'Jueves' WHEN 5 THEN 'Viernes'
          ELSE 'Sábado' END
    LEFT JOIN attendances a ON a.user_id = u.id AND a.date = d.fecha
    LEFT JOIN holidays hol ON hol.date = d.fecha AND hol.active = true
    WHERE hd.schedule_id IS NOT NULL          -- día con horario (excluye descanso)
      AND hol.id IS NULL                      -- excluye festivos
      AND h.modality NOT IN ('flexible', 'by_hours') -- REQ-01 flexible
  `;
  if (filtros.area) {
    params.push(`%${filtros.area}%`);
    sql += ` AND ar.name LIKE $${params.length}`;
  }
  if (filtros.piso !== undefined && filtros.piso !== null && filtros.piso !== "") {
    params.push(Number(filtros.piso));
    sql += ` AND NULLIF(regexp_replace(fl.name, '\\D', '', 'g'), '')::int = $${params.length}`;
  }
  if (filtros.busqueda) {
    const term = `%${filtros.busqueda}%`;
    params.push(term, term, term);
    sql += ` AND (u.first_name LIKE $${params.length - 2} OR u.first_surname LIKE $${params.length - 1} OR dd.document_number LIKE $${params.length})`;
  }
  sql += ` ORDER BY d.fecha DESC, u.first_surname, u.first_name`;
  const { rows } = await pool.query(sql, params);
  return rows;
}

/**
 * Consulta B — novedades APROBADAS que solapan la ventana (batch, anti-N+1).
 * SIEMPRE status='approved'.
 */
async function consultarNovedades(fechaDesde: unknown, fechaHasta: unknown): Promise<Map<number, NovedadFila[]>> {
  const { rows } = await pool.query(
    `SELECT n.user_id AS usuario_id, n.date_from AS fecha_desde, n.date_to AS fecha_hasta,
            n.mark_type AS tipo,
            n.time_from AS hora_desde, n.time_to AS hora_hasta
     FROM news n
     WHERE n.status = 'approved'
       AND n.date_from <= $2 AND n.date_to >= $1`,
    [fechaDesde, fechaHasta]
  );
  const porUsuario = new Map();
  for (const n of rows) {
    if (!porUsuario.has(n.usuario_id)) porUsuario.set(n.usuario_id, []);
    porUsuario.get(n.usuario_id).push(n);
  }
  return porUsuario;
}

/**
 * Consulta C — incidencias formales de la ventana (batch, anti-N+1) que
 * habilitan tiene_incidencia / "Ver en Incidencias" (REQ-04/05/10).
 */
async function consultarIncidencias(fechaDesde: unknown, fechaHasta: unknown): Promise<Map<string, any[]>> {
  const { rows } = await pool.query(
    `SELECT i.id, i.user_id AS usuario_id, i.date AS fecha, i.status AS estado, i.type AS tipo
     FROM incidents i
     WHERE i.date BETWEEN $1 AND $2
       AND i.type IN ('unregistered_exit', 'afternoon_absence', 'late', 'biometric_failure')`,
    [fechaDesde, fechaHasta]
  );
  const porUsuarioFecha = new Map<string, any[]>();
  for (const inc of rows) {
    const key = `${inc.usuario_id}|${fmtDate(inc.fecha)}`;
    if (!porUsuarioFecha.has(key)) porUsuarioFecha.set(key, []);
    porUsuarioFecha.get(key)!.push(inc);
  }
  return porUsuarioFecha;
}

/**
 * Elige la incidencia vinculable más relevante para la fila: primero la que
 * corresponde a la situación (afternoon_absence para missing_afternoon,
 * unregistered_exit para unregistered_exit); si no, la primera del día.
 */
function elegirIncidencia(incidencias: any[] | undefined, situacion: string): any {
  if (!incidencias || incidencias.length === 0) return null;
  const preferido = INCIDENCIA_POR_SITUACION[situacion];
  return incidencias.find((i) => i.tipo === preferido) || incidencias[0];
}

/** Tramo del horario para el día ('morning' | 'afternoon' | 'full'). */
function tramoDelDia(fila: FilaUniverso): string {
  const hasManana = Boolean(fila.exp_ent_manana && fila.exp_sal_manana);
  const hasTarde = Boolean(fila.exp_ent_tarde && fila.exp_sal_tarde);
  if (hasManana && hasTarde) return "full";
  if (hasManana) return "morning";
  return "afternoon";
}

/** Construye el registro de respuesta a partir de una fila clasificada. */
function armarRegistro(fila: any, situacion: string, incidencia: any) {
  return {
    usuario_id: fila.usuario_id,
    cedula: fila.cedula,
    empleado: fila.empleado,
    area: fila.area,
    piso: fila.piso,
    fecha: fila._fechaISO,
    situacion,
    tramo: tramoDelDia(fila),
    entrada_manana: fila.entrada_manana || null,
    salida_manana: fila.salida_manana || null,
    entrada_tarde: fila.entrada_tarde || null,
    salida_tarde: fila.salida_tarde || null,
    esperado_entrada_manana: fila.exp_ent_manana || null,
    esperado_salida_manana: fila.exp_sal_manana || null,
    esperado_entrada_tarde: fila.exp_ent_tarde || null,
    esperado_salida_tarde: fila.exp_sal_tarde || null,
    tiene_incidencia: Boolean(incidencia),
    incidencia_estado: incidencia ? incidencia.estado : null,
    incidencia_id: incidencia ? incidencia.id : null,
  };
}

interface SeguimientoFiltros {
  page?: unknown;
  pageSize?: unknown;
  fecha_desde?: unknown;
  fecha_hasta?: unknown;
  area?: unknown;
  piso?: unknown;
  busqueda?: unknown;
  situacion?: unknown;
}

/**
 * Clasifica toda la ventana filtrada (fecha/área/piso/búsqueda) y devuelve:
 *  - rows: página solicitada de la lista (tras aplicar el filtro de situación).
 *  - total: filas que cumplen TODOS los filtros incluida la situación.
 *  - kpis: total + contador por situación sobre la ventana filtrada COMPLETA.
 *  - page / pageSize devueltos tal cual entraron.
 *
 * Límite anti-abuso: pageSize ≤ 500 (REQ-15).
 */
export async function clasificar(filtros: SeguimientoFiltros = {}) {
  const page = Math.max(1, Number.parseInt(String(filtros.page), 10) || 1);
  const pageSizeRaw = Number.parseInt(String(filtros.pageSize), 10);
  const pageSize = Number.isNaN(pageSizeRaw)
    ? PAGE_SIZE_DEFAULT
    : Math.min(Math.max(1, pageSizeRaw), PAGE_SIZE_MAX);

  const fechaDesde = filtros.fecha_desde;
  const fechaHasta = filtros.fecha_hasta;
  const hoy = hoyISO();

  const [filas, novedadesPorUsuario, incidenciasPorUsuarioFecha] = await Promise.all([
    consultarUniverso(filtros),
    consultarNovedades(fechaDesde, fechaHasta),
    consultarIncidencias(fechaDesde, fechaHasta),
  ]);

  const clasificados: any[] = [];
  const conteos: Record<string, number> = {};
  for (const slug of Object.values(SITUACION)) conteos[slug] = 0;

  for (const fila of filas) {
    const fechaISO = fmtDate(fila.fecha);
    fila._fechaISO = fechaISO;

    const novedades = novedadesPorUsuario.get(fila.usuario_id) || [];
    const situacion = clasificarFila(fila, { novedades, hoyISO: hoy });
    if (!situacion) continue; // excluido (resuelto, cubierto, flexible, etc.)

    conteos[situacion] += 1;

    if (filtros.situacion && situacion !== filtros.situacion) continue;

    const incidencias = incidenciasPorUsuarioFecha.get(`${fila.usuario_id}|${fechaISO}`) || [];
    const incidencia = elegirIncidencia(incidencias, situacion);
    clasificados.push(armarRegistro(fila, situacion, incidencia));
  }

  const totalVentana = Object.values(conteos).reduce((acc, n) => acc + n, 0);

  return {
    rows: clasificados.slice((page - 1) * pageSize, page * pageSize),
    total: clasificados.length,
    page,
    pageSize,
    kpis: { total: totalVentana, ...conteos },
  };
}