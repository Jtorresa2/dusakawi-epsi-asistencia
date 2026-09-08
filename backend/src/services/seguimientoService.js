const pool = require("../config/db");
const { timeToMinutes } = require("./marcacionService");

/**
 * Seguimiento de Asistencia — módulo de SOLO CONSULTA (REQ-01..15).
 *
 * Clasifica cada (usuario, fecha) laboral en EXACTAMENTE una de 5 situaciones
 * (fila única), con precedencia 1→5 y de forma tramo-aware contra
 * horario_detalle. Reutiliza asistencia, novedades (SOLO estado='aprobado'),
 * incidencias y horario_detalle. NO escribe nada: ni asistencia, ni
 * incidencias, ni novedades. NO lee la columna marcacion_estado (deriva todo
 * por timestamps, inmune a drift de esquema).
 *
 * Anti-N+1 (REQ-15): 3 consultas batch sobre la ventana — universo
 * (usuario,fecha), novedades aprobadas e incidencias vinculables — y toda la
 * clasificación se resuelve en memoria.
 */

const SITUACION = Object.freeze({
  AUSENCIA: "ausencia",
  FALTA_MANANA: "falta_manana",
  FALTA_TARDE: "falta_tarde",
  SALIDA_NO_REGISTRADA: "salida_no_registrada",
  JORNADA_ABIERTA: "jornada_abierta",
});

// Incidencias formales que el módulo puede vincular a una fila (REQ-04/05/10).
// 'tardanza' y 'falla_biometrica' no generan situación propia pero sí habilitan
// "Ver en Incidencias" cuando existen para ese (usuario, fecha).
const TIPOS_INCIDENCIA_VINCULABLES = [
  "salida_no_registrada",
  "ausencia_tarde",
  "tardanza",
  "falla_biometrica",
];

// Tipo de incidencia formal que corresponde a cada situación (para elegir el
// vínculo más relevante cuando hay varias el mismo día).
const INCIDENCIA_POR_SITUACION = {
  [SITUACION.FALTA_TARDE]: "ausencia_tarde",
  [SITUACION.SALIDA_NO_REGISTRADA]: "salida_no_registrada",
};

const PAGE_SIZE_MAX = 500;
const PAGE_SIZE_DEFAULT = 100;

/**
 * Formatea una fecha (Date de pg o string) a 'YYYY-MM-DD' local.
 * NO usar toISOString: desplazaría el día en husos negativos.
 */
function fmtDate(d) {
  if (d instanceof Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  }
  return String(d).substring(0, 10);
}

/** 'YYYY-MM-DD' local de hoy (del servidor). */
function hoyISO() {
  return fmtDate(new Date());
}

/**
 * ¿Existe una novedad APROBADA cuyo rango [fecha_desde, fecha_hasta] cubra la
 * fecha? (REQ-02 esc. 2: cualquier tipo que cubra la fecha excluye la ausencia).
 */
function novedadCubreFecha(novedades, fechaISO) {
  return novedades.some(
    (n) => fmtDate(n.fecha_desde) <= fechaISO && fmtDate(n.fecha_hasta) >= fechaISO
  );
}

/**
 * ¿Una novedad aprobada cubre el TRAMO indicado del horario? Espejo en memoria
 * de la semántica de `obtenerNovedadQueCubreTarde` de marcacionService (mañana
 * = espejo, día completo = cualquier tipo que cubra la fecha):
 *
 *  - 'dia_completo' → cubre cualquier tramo.
 *  - 'manana'/'tarde' → cubre solo su tramo homónimo.
 *  - 'horas' → cubre solo si [hora_desde, hora_hasta] solapa el tramo del
 *    horario ([hora_entrada_<tramo>, hora_salida_<tramo>]).
 *
 * @param {Array} novedades Novedades aprobadas del usuario (batch).
 * @param {string} fechaISO 'YYYY-MM-DD'
 * @param {'manana'|'tarde'} tramo
 * @param {object} fila Fila del universo (exp_ent_manana… exp_sal_tarde).
 */
function novedadCubreTramo(novedades, fechaISO, tramo, fila) {
  const entrada = tramo === "manana" ? fila.exp_ent_manana : fila.exp_ent_tarde;
  const salida = tramo === "manana" ? fila.exp_sal_manana : fila.exp_sal_tarde;
  const iniTramo = entrada ? timeToMinutes(entrada) : null;
  const finTramo = salida ? timeToMinutes(salida) : null;

  return novedades.some((n) => {
    if (fmtDate(n.fecha_desde) > fechaISO || fmtDate(n.fecha_hasta) < fechaISO) return false;
    const tipo = n.tipo; // modalidad: dia_completo | horas | manana | tarde
    if (tipo === "dia_completo") return true;
    if (tipo === tramo) return true;
    if (tipo === "horas") {
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

/**
 * Clasifica UNA fila del universo en una situación (o null si queda excluida).
 *
 * Precedencia (REQ-01): ausencia(1) > falta_mañana(2) > falta_tarde(3) >
 * salida_no_registrada(4) > jornada_abierta(5). Fila única por (usuario,fecha).
 *
 * Reglas de exclusión (REQ-01/02/04 + diseño):
 *  - Sin tramos reales definidos en horario_detalle (día sin horario) → null.
 *  - Jornada resuelta (tramos completos, o cubiertos por novedad aprobada)
 *    → null (p.ej. solo-tarde con 2 marcas = completa; REQ-01 esc. 1).
 *  - Fechas futuras → null.
 *  - 0 marcas con novedad aprobada que cubre la fecha → null (REQ-02 esc. 2).
 *  - 0 marcas HOY → null (día en curso aún no confirmable).
 *  - Día en curso (hoy) incompleto → jornada_abierta (REQ-06).
 *  - Día pasado con marcas → precedencia estricta 1→5.
 *
 * @param {object} fila Fila del universo: { entrada_manana, salida_manana,
 *   entrada_tarde, salida_tarde, exp_ent_manana, exp_sal_manana,
 *   exp_ent_tarde, exp_sal_tarde, _fechaISO }.
 * @param {object} ctx { novedades: [], hoyISO: 'YYYY-MM-DD' }.
 * @returns {string|null} Slug de SITUACION o null (excluido).
 */
function clasificarFila(fila, ctx = {}) {
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
  const cubreManana = novedadCubreTramo(novedades, fecha, "manana", fila);
  const cubreTarde = novedadCubreTramo(novedades, fecha, "tarde", fila);

  // Jornada resuelta: cada tramo definido quedó marcado o cubierto por novedad
  // aprobada. Una jornada resuelta NO aparece en la lista (REQ-01, REQ-04 esc.2).
  let completa;
  if (hasManana && hasTarde) {
    completa = (parManana || cubreManana) && (parTarde || cubreTarde);
  } else {
    completa = parManana || parTarde || (hasManana ? cubreManana : cubreTarde);
  }
  if (completa) return null;

  if (fecha > hoy) return null; // futuro: nada que reportar

  const algunaMarca = Boolean(ent || salM || entT || salT);

  // (1) Ausencia de día completo: 0 marcas en día laboral (REQ-02).
  if (!algunaMarca) {
    if (novedadCubreFecha(novedades, fecha)) return null; // esc. 2: cubierta
    if (fecha === hoy) return null; // hoy aún puede marcar → no confirmable
    return SITUACION.AUSENCIA;
  }

  // Día en curso con marcas incompletas → jornada abierta (REQ-06).
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
 * usuarios activos con horario, LEFT JOIN asistencia + horario_detalle
 * tramo-aware + exclusión de festivos y modalidades flexible/por_horas
 * (REQ-01 esc. flexible) y días sin horario (descanso).
 *
 * Filtros aplicados aquí: fecha (rango), area (LIKE nombre), piso y busqueda
 * (nombre/apellido/cédula). El filtro de situación se aplica en memoria porque
 * la situación se deriva por clasificación, no en SQL.
 */
async function consultarUniverso(filtros = {}) {
  const params = [filtros.fecha_desde, filtros.fecha_hasta];
  let sql = `
    SELECT u.id AS usuario_id, u.cedula,
      CONCAT(u.nombre, ' ', u.apellido) AS empleado,
      ar.nombre AS area,
      COALESCE(u.piso, ar.piso) AS piso,
      d.fecha::text AS fecha,   -- día civil 'YYYY-MM-DD' (sin desplazamiento de zona)
      TO_CHAR(a.fecha_hora_entrada, 'HH24:MI') AS entrada_manana,
      TO_CHAR(a.fecha_hora_salida_manana, 'HH24:MI') AS salida_manana,
      TO_CHAR(a.fecha_hora_entrada_tarde, 'HH24:MI') AS entrada_tarde,
      TO_CHAR(a.fecha_hora_salida, 'HH24:MI') AS salida_tarde,
      TO_CHAR(hd.hora_entrada_manana, 'HH24:MI') AS exp_ent_manana,
      TO_CHAR(hd.hora_salida_manana, 'HH24:MI') AS exp_sal_manana,
      TO_CHAR(hd.hora_entrada_tarde, 'HH24:MI') AS exp_ent_tarde,
      TO_CHAR(hd.hora_salida_tarde, 'HH24:MI') AS exp_sal_tarde
    FROM generate_series($1::date, $2::date, '1 day') AS d(fecha)
    JOIN usuarios u ON u.activo = true AND u.horario_id IS NOT NULL
    JOIN areas ar ON u.area_id = ar.id
    LEFT JOIN horarios h ON u.horario_id = h.id
    LEFT JOIN horario_detalle hd ON hd.horario_id = u.horario_id
      AND hd.dia_semana = CASE EXTRACT(DOW FROM d.fecha)
          WHEN 0 THEN 'Domingo' WHEN 1 THEN 'Lunes' WHEN 2 THEN 'Martes'
          WHEN 3 THEN 'Miércoles' WHEN 4 THEN 'Jueves' WHEN 5 THEN 'Viernes'
          ELSE 'Sábado' END
    LEFT JOIN asistencia a ON a.usuario_id = u.id AND a.fecha = d.fecha
    LEFT JOIN festivos f ON f.fecha = d.fecha AND f.activo = true
    WHERE hd.horario_id IS NOT NULL          -- día con horario (excluye descanso)
      AND f.id IS NULL                       -- excluye festivos
      AND h.modalidad NOT IN ('flexible', 'por_horas') -- REQ-01 flexible
  `;
  if (filtros.area) {
    params.push(`%${filtros.area}%`);
    sql += ` AND ar.nombre LIKE $${params.length}`;
  }
  if (filtros.piso !== undefined && filtros.piso !== null && filtros.piso !== "") {
    params.push(Number(filtros.piso));
    sql += ` AND COALESCE(u.piso, ar.piso) = $${params.length}`;
  }
  if (filtros.busqueda) {
    const term = `%${filtros.busqueda}%`;
    params.push(term, term, term);
    sql += ` AND (u.nombre LIKE $${params.length - 2} OR u.apellido LIKE $${params.length - 1} OR u.cedula LIKE $${params.length})`;
  }
  sql += ` ORDER BY d.fecha DESC, u.apellido, u.nombre`;
  const { rows } = await pool.query(sql, params);
  return rows;
}

/**
 * Consulta B — novedades APROBADAS que solapan la ventana (batch, anti-N+1).
 * SIEMPRE estado='aprobado' (nunca el patrón de /api/pdf/ausencias, que no
 * filtra estado).
 */
async function consultarNovedades(fechaDesde, fechaHasta) {
  const { rows } = await pool.query(
    `SELECT n.usuario_id, n.fecha_desde, n.fecha_hasta, n.tipo,
            n.hora_desde, n.hora_hasta
     FROM novedades n
     WHERE n.estado = 'aprobado'
       AND n.fecha_desde <= $2 AND n.fecha_hasta >= $1`,
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
async function consultarIncidencias(fechaDesde, fechaHasta) {
  const { rows } = await pool.query(
    `SELECT i.id, i.usuario_id, i.fecha, i.estado, i.tipo
     FROM incidencias i
     WHERE i.fecha BETWEEN $1 AND $2
       AND i.tipo IN ('salida_no_registrada', 'ausencia_tarde', 'tardanza', 'falla_biometrica')`,
    [fechaDesde, fechaHasta]
  );
  const porUsuarioFecha = new Map();
  for (const inc of rows) {
    const key = `${inc.usuario_id}|${fmtDate(inc.fecha)}`;
    if (!porUsuarioFecha.has(key)) porUsuarioFecha.set(key, []);
    porUsuarioFecha.get(key).push(inc);
  }
  return porUsuarioFecha;
}

/**
 * Elige la incidencia vinculable más relevante para la fila: primero la que
 * corresponde a la situación (ausencia_tarde para falta_tarde,
 * salida_no_registrada para salida_no_registrada); si no, la primera del día.
 */
function elegirIncidencia(incidencias, situacion) {
  if (!incidencias || incidencias.length === 0) return null;
  const preferido = INCIDENCIA_POR_SITUACION[situacion];
  return incidencias.find((i) => i.tipo === preferido) || incidencias[0];
}

/** Tramo del horario para el día ('manana' | 'tarde' | 'completo'). */
function tramoDelDia(fila) {
  const hasManana = Boolean(fila.exp_ent_manana && fila.exp_sal_manana);
  const hasTarde = Boolean(fila.exp_ent_tarde && fila.exp_sal_tarde);
  if (hasManana && hasTarde) return "completo";
  if (hasManana) return "manana";
  return "tarde";
}

/** Construye el registro de respuesta a partir de una fila clasificada. */
function armarRegistro(fila, situacion, incidencia) {
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

/**
 * Clasifica toda la ventana filtrada (fecha/área/piso/búsqueda) y devuelve:
 *  - rows: página solicitada de la lista (tras aplicar el filtro de situación).
 *  - total: filas que cumplen TODOS los filtros incluida la situación
 *    (metadato de paginación).
 *  - kpis: total + contador por situación sobre la ventana filtrada COMPLETA
 *    (sin el filtro de situación, para que las tarjetas sigan mostrando el
 *    desglose real aunque la lista esté acotada).
 *  - page / pageSize devueltos tal cual entraron.
 *
 * Límite anti-abuso: pageSize ≤ 500 (REQ-15).
 *
 * @param {object} filtros { fecha_desde, fecha_hasta, area, piso, busqueda,
 *   situacion, page, pageSize }
 */
async function clasificar(filtros = {}) {
  const page = Math.max(1, Number.parseInt(filtros.page, 10) || 1);
  const pageSizeRaw = Number.parseInt(filtros.pageSize, 10);
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

  const clasificados = [];
  const conteos = {};
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

module.exports = {
  clasificar,
  // Exports auxiliares (reutilizables por PR2/PDF y por la verificación manual).
  clasificarFila,
  novedadCubreFecha,
  novedadCubreTramo,
  SITUACION,
  fmtDate,
  hoyISO,
  PAGE_SIZE_MAX,
  PAGE_SIZE_DEFAULT,
};
