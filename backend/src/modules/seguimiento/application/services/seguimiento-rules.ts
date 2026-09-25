// Reglas de clasificación 1:1 del legacy seguimientoService.js.
//
// Clasifica cada (usuario, fecha) laboral en EXACTAMENTE una de 5 situaciones
// (fila única), con precedencia 1→5 y de forma tramo-aware contra
// schedule_details. Reutiliza attendances, news (SOLO status='approved'),
// incidents y schedule_details. NO escribe nada.
//
// Nótese que `mark_type` de news es la MODALIDAD (full_day/morning/
// afternoon/hours) — el módulo novedades la escribe ahí (news_type es el
// tipo). Por eso aquí `n.tipo` se compara contra tramos/modalidades.

import {
  INCIDENCIA_POR_SITUACION,
  PAGE_SIZE_DEFAULT,
  PAGE_SIZE_MAX,
  SITUACION,
  type FilaUniversoSeguimiento,
  type IncidenciaVinculoRow,
  type KpisSeguimiento,
  type NovedadVinculoRow,
  type RegistroSeguimiento,
  type ResultadoSeguimiento,
} from '../../domain/entities/seguimiento';

export function timeToMinutes(timeStr: string | null | undefined): number | null {
  if (!timeStr) return null;
  const parts = String(timeStr).split(':').map(Number);
  return (parts[0] || 0) * 60 + (parts[1] || 0);
}

export function fmtDate(d: Date | string): string {
  if (d instanceof Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  }
  return String(d).substring(0, 10);
}

export function hoyISO(): string {
  return fmtDate(new Date());
}

function novedadCubreFecha(novedades: NovedadVinculoRow[], fechaISO: string): boolean {
  return novedades.some(
    (n) => fmtDate(n.fecha_desde) <= fechaISO && fmtDate(n.fecha_hasta) >= fechaISO
  );
}

function novedadCubreTramo(
  novedades: NovedadVinculoRow[],
  fechaISO: string,
  tramo: 'morning' | 'afternoon',
  fila: FilaUniversoSeguimiento
): boolean {
  const entrada = tramo === 'morning' ? fila.exp_ent_manana : fila.exp_ent_tarde;
  const salida = tramo === 'morning' ? fila.exp_sal_manana : fila.exp_sal_tarde;
  const iniTramo = entrada ? timeToMinutes(entrada) : null;
  const finTramo = salida ? timeToMinutes(salida) : null;

  return novedades.some((n) => {
    if (fmtDate(n.fecha_desde) > fechaISO || fmtDate(n.fecha_hasta) < fechaISO) return false;
    const tipo = n.tipo;
    if (tipo === 'full_day') return true;
    if (tipo === tramo) return true;
    if (tipo === 'hours') {
      if (iniTramo === null || finTramo === null) return false;
      const desde = timeToMinutes(n.hora_desde);
      const hasta = timeToMinutes(n.hora_hasta);
      if (desde === null || hasta === null) return false;
      return desde <= finTramo && hasta >= iniTramo;
    }
    return false;
  });
}

function clasificarFila(
  fila: FilaUniversoSeguimiento,
  ctx: { hoyISO: string; novedades: NovedadVinculoRow[] }
): string | null {
  const ent = fila.entrada_manana;
  const salM = fila.salida_manana;
  const entT = fila.entrada_tarde;
  const salT = fila.salida_tarde;

  const hasManana = Boolean(fila.exp_ent_manana && fila.exp_sal_manana);
  const hasTarde = Boolean(fila.exp_ent_tarde && fila.exp_sal_tarde);
  if (!hasManana && !hasTarde) return null;

  const fecha = fila._fechaISO;
  if (!fecha) return null;
  const hoy = ctx.hoyISO;
  const novedades = ctx.novedades || [];

  const parManana = Boolean(ent && salM);
  const parTarde = Boolean(entT && salT);
  const cubreManana = novedadCubreTramo(novedades, fecha, 'morning', fila);
  const cubreTarde = novedadCubreTramo(novedades, fecha, 'afternoon', fila);

  let completa: boolean;
  if (hasManana && hasTarde) {
    completa = (parManana || cubreManana) && (parTarde || cubreTarde);
  } else {
    completa = parManana || parTarde || (hasManana ? cubreManana : cubreTarde);
  }
  if (completa) return null;

  if (hoy && fecha > hoy) return null;

  const algunaMarca = Boolean(ent || salM || entT || salT);

  if (!algunaMarca) {
    if (novedadCubreFecha(novedades, fecha)) return null;
    if (fecha === hoy) return null;
    return SITUACION.AUSENCIA;
  }

  if (fecha === hoy) return SITUACION.JORNADA_ABIERTA;

  if (hasManana && !ent) {
    if (!cubreManana) return SITUACION.FALTA_MANANA;
  }
  if (hasTarde && ent && salM && !entT) {
    if (!cubreTarde) return SITUACION.FALTA_TARDE;
    return null;
  }
  const tramoAbierto = (ent && !salM) || (entT && !salT);
  if (tramoAbierto) return SITUACION.SALIDA_NO_REGISTRADA;
  return SITUACION.JORNADA_ABIERTA;
}

function elegirIncidencia(
  incidencias: IncidenciaVinculoRow[] | undefined | null,
  situacion: string
): IncidenciaVinculoRow | null {
  if (!incidencias || incidencias.length === 0) return null;
  const preferido = INCIDENCIA_POR_SITUACION[situacion];
  return incidencias.find((i) => i.tipo === preferido) || incidencias[0];
}

function tramoDelDia(fila: FilaUniversoSeguimiento): 'full' | 'morning' | 'afternoon' {
  const hasManana = Boolean(fila.exp_ent_manana && fila.exp_sal_manana);
  const hasTarde = Boolean(fila.exp_ent_tarde && fila.exp_sal_tarde);
  if (hasManana && hasTarde) return 'full';
  if (hasManana) return 'morning';
  return 'afternoon';
}

function armarRegistro(
  fila: FilaUniversoSeguimiento,
  situacion: string,
  incidencia: IncidenciaVinculoRow | null
): RegistroSeguimiento {
  return {
    usuario_id: fila.usuario_id,
    cedula: fila.cedula,
    empleado: fila.empleado,
    area: fila.area,
    piso: fila.piso,
    fecha: fila._fechaISO!,
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

export interface ClasificarInput {
  filas: FilaUniversoSeguimiento[];
  novedades: NovedadVinculoRow[];
  incidencias: IncidenciaVinculoRow[];
  filtros: { situacion?: string; page?: string | number; pageSize?: string | number };
}

export async function clasificar(input: ClasificarInput): Promise<ResultadoSeguimiento> {
  const { filas, novedades, incidencias, filtros } = input;
  const page = Math.max(1, Number.parseInt(String(filtros.page), 10) || 1);
  const pageSizeRaw = Number.parseInt(String(filtros.pageSize), 10);
  const pageSize = Number.isNaN(pageSizeRaw)
    ? PAGE_SIZE_DEFAULT
    : Math.min(Math.max(1, pageSizeRaw), PAGE_SIZE_MAX);

  const hoy = hoyISO();

  // Agrupaciones en memoria (réplica de los Map del legacy).
  const novedadesPorUsuario = new Map<string, NovedadVinculoRow[]>();
  for (const n of novedades) {
    if (!novedadesPorUsuario.has(n.usuario_id)) novedadesPorUsuario.set(n.usuario_id, []);
    novedadesPorUsuario.get(n.usuario_id)!.push(n);
  }
  const incidenciasPorUsuarioFecha = new Map<string, IncidenciaVinculoRow[]>();
  for (const inc of incidencias) {
    const key = `${inc.usuario_id}|${fmtDate(inc.fecha)}`;
    if (!incidenciasPorUsuarioFecha.has(key)) incidenciasPorUsuarioFecha.set(key, []);
    incidenciasPorUsuarioFecha.get(key)!.push(inc);
  }

  const clasificados: RegistroSeguimiento[] = [];
  const conteos: Record<string, number> = {};
  for (const slug of Object.values(SITUACION) as string[]) conteos[slug] = 0;

  for (const fila of filas) {
    const fechaISO = fmtDate(fila.fecha);
    fila._fechaISO = fechaISO;

    const novedadesUsuario = novedadesPorUsuario.get(fila.usuario_id) || [];
    const situacion = clasificarFila(fila, { novedades: novedadesUsuario, hoyISO: hoy });
    if (!situacion) continue;

    conteos[situacion] += 1;

    if (filtros.situacion && situacion !== filtros.situacion) continue;

    const incidenciasVinculables =
      incidenciasPorUsuarioFecha.get(`${fila.usuario_id}|${fechaISO}`) || [];
    const incidencia = elegirIncidencia(incidenciasVinculables, situacion);
    clasificados.push(armarRegistro(fila, situacion, incidencia));
  }

  const totalVentana = Object.values(conteos).reduce((acc, n) => acc + n, 0);

  // Orden de claves idéntico al legacy: total primero, luego los slugs.
  const kpis: KpisSeguimiento = {
    total: totalVentana,
    absence: conteos.absence ?? 0,
    missing_morning: conteos.missing_morning ?? 0,
    missing_afternoon: conteos.missing_afternoon ?? 0,
    unregistered_exit: conteos.unregistered_exit ?? 0,
    open_day: conteos.open_day ?? 0,
  };

  return {
    rows: clasificados.slice((page - 1) * pageSize, page * pageSize),
    total: clasificados.length,
    page,
    pageSize,
    kpis,
  };
}