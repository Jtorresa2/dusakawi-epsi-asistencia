const pool = require('../config/db');

/**
 * Seguimiento de Asistencia — módulo de SOLO CONSULTA.
 *
 * Clasifica cada (usuario, fecha) laboral en EXACTAMENTE una de 5 situaciones
 * (fila única), con precedencia 1→5 y de forma tramo-aware contra
 * schedule_details. Reutiliza attendances, news (SOLO status='approved'),
 * incidents y schedule_details. NO escribe nada.
 *
 * Anti-N+1: 3 consultas batch sobre la ventana — universo (usuario,fecha),
 * novedades aprobadas e incidencias vinculables — y toda la clasificación se
 * resuelve en memoria.
 */

const SITUACION = Object.freeze({
  AUSENCIA: 'absence',
  FALTA_MANANA: 'missing_morning',
  FALTA_TARDE: 'missing_afternoon',
  SALIDA_NO_REGISTRADA: 'unregistered_exit',
  JORNADA_ABIERTA: 'open_day',
});

const INCIDENCIA_POR_SITUACION = {
  [SITUACION.FALTA_TARDE]: 'afternoon_absence',
  [SITUACION.SALIDA_NO_REGISTRADA]: 'unregistered_exit',
};

const PAGE_SIZE_MAX = 500;
const PAGE_SIZE_DEFAULT = 100;

function timeToMinutes(timeStr) {
  if (!timeStr) return null;
  const parts = String(timeStr).split(':').map(Number);
  return (parts[0] || 0) * 60 + (parts[1] || 0);
}

function fmtDate(d) {
  if (d instanceof Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  }
  return String(d).substring(0, 10);
}

function hoyISO() {
  return fmtDate(new Date());
}

function novedadCubreFecha(novedades, fechaISO) {
  return novedades.some(
    (n) => fmtDate(n.fecha_desde) <= fechaISO && fmtDate(n.fecha_hasta) >= fechaISO
  );
}

function novedadCubreTramo(novedades, fechaISO, tramo, fila) {
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

function clasificarFila(fila, ctx) {
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

  let completa;
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

async function consultarUniverso(filtros) {
  const params = [filtros.fecha_desde, filtros.fecha_hasta];
  let sql = `
    SELECT u.id AS usuario_id, dd.document_number AS cedula,
      CONCAT(u.first_name, ' ', u.first_surname) AS empleado,
      ar.name AS area,
      NULLIF(regexp_replace(fl.name, '\\D', '', 'g'), '')::int AS piso,
      d.fecha::text AS fecha,
      TO_CHAR(a.entry_timestamp, 'HH24:MI') AS entrada_manana,
      TO_CHAR(a.morning_departure_timestamp, 'HH24:MI') AS salida_manana,
      TO_CHAR(a.afternoon_entry_timestamp, 'HH24:MI') AS entrada_tarde,
      TO_CHAR(a.departure_timestamp, 'HH24:MI') AS salida_tarde,
      TO_CHAR(hd.morning_entry, 'HH24:MI') AS exp_ent_manana,
      TO_CHAR(hd.morning_exit, 'HH24:MI') AS exp_sal_manana,
      TO_CHAR(hd.afternoon_entry, 'HH24:MI') AS exp_ent_tarde,
      TO_CHAR(hd.afternoon_exit, 'HH24:MI') AS exp_sal_tarde
    FROM generate_series(?::date, ?::date, '1 day') AS d(fecha)
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
    WHERE hd.schedule_id IS NOT NULL
      AND hol.id IS NULL
      AND h.modality NOT IN ('flexible', 'by_hours')
  `;
  if (filtros.area) {
    params.push(`%${filtros.area}%`);
    sql += ' AND ar.name LIKE ?';
  }
  if (filtros.piso !== undefined && filtros.piso !== null && filtros.piso !== '') {
    params.push(Number(filtros.piso));
    sql += ` AND NULLIF(regexp_replace(fl.name, '\\D', '', 'g'), '')::int = ?`;
  }
  if (filtros.busqueda) {
    const term = `%${filtros.busqueda}%`;
    params.push(term, term, term);
    sql += ' AND (u.first_name LIKE ? OR u.first_surname LIKE ? OR dd.document_number LIKE ?)';
  }
  sql += ' ORDER BY d.fecha DESC, u.first_surname, u.first_name';
  const [rows] = await pool.query(sql, params);
  return rows;
}

async function consultarNovedades(fechaDesde, fechaHasta) {
  const [rows] = await pool.query(
    `SELECT n.user_id AS usuario_id, n.date_from AS fecha_desde, n.date_to AS fecha_hasta,
            n.mark_type AS tipo,
            n.time_from AS hora_desde, n.time_to AS hora_hasta
     FROM news n
     WHERE n.status = 'approved'
       AND n.date_from <= ? AND n.date_to >= ?`,
    [fechaDesde, fechaHasta]
  );
  const porUsuario = new Map();
  for (const n of rows) {
    if (!porUsuario.has(n.usuario_id)) porUsuario.set(n.usuario_id, []);
    porUsuario.get(n.usuario_id).push(n);
  }
  return porUsuario;
}

async function consultarIncidencias(fechaDesde, fechaHasta) {
  const [rows] = await pool.query(
    `SELECT i.id, i.user_id AS usuario_id, i.date AS fecha, i.status AS estado, i.type AS tipo
     FROM incidents i
     WHERE i.date BETWEEN ? AND ?
       AND i.type IN ('unregistered_exit', 'afternoon_absence', 'late', 'biometric_failure')`,
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

function elegirIncidencia(incidencias, situacion) {
  if (!incidencias || incidencias.length === 0) return null;
  const preferido = INCIDENCIA_POR_SITUACION[situacion];
  return incidencias.find((i) => i.tipo === preferido) || incidencias[0];
}

function tramoDelDia(fila) {
  const hasManana = Boolean(fila.exp_ent_manana && fila.exp_sal_manana);
  const hasTarde = Boolean(fila.exp_ent_tarde && fila.exp_sal_tarde);
  if (hasManana && hasTarde) return 'full';
  if (hasManana) return 'morning';
  return 'afternoon';
}

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

async function clasificar(filtros) {
  filtros = filtros || {};
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

  const clasificados = [];
  const conteos = {};
  for (const slug of Object.values(SITUACION)) conteos[slug] = 0;

  for (const fila of filas) {
    const fechaISO = fmtDate(fila.fecha);
    fila._fechaISO = fechaISO;

    const novedades = novedadesPorUsuario.get(fila.usuario_id) || [];
    const situacion = clasificarFila(fila, { novedades, hoyISO: hoy });
    if (!situacion) continue;

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
  SITUACION,
  PAGE_SIZE_MAX,
  PAGE_SIZE_DEFAULT,
  fmtDate,
  hoyISO,
  clasificar,
};