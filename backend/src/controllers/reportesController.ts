import pool from '../config/db';
import { Request, Response } from 'express';

const PISO_EXPR = "NULLIF(regexp_replace(fl.name, '\\D', '', 'g'), '')::int";

export const getReporteDiario = async (req: Request, res: Response) => {
  try {
    const { fecha } = req.query;
    const fechaConsulta = fecha || new Date().toISOString().split("T")[0];
    const { rows: registros } = await pool.query(`
      SELECT CONCAT(u.first_name, ' ', u.first_surname) AS empleado, dd.document_number AS cedula,
        ar.name AS area, ${PISO_EXPR} AS piso, a.date AS fecha,
        TO_CHAR(a.entry_timestamp, 'HH24:MI') AS entrada1,
        TO_CHAR(a.morning_departure_timestamp, 'HH24:MI') AS salida1,
        TO_CHAR(a.afternoon_entry_timestamp, 'HH24:MI') AS entrada2,
        TO_CHAR(a.departure_timestamp, 'HH24:MI') AS salida2,
        a.worked_hours AS horas_trabajadas, a.late_minutes AS minutos_tardanza, a.mark_type AS tipo_marcacion, a.status AS estado, a.observation AS observacion
      FROM attendances a JOIN users u ON a.user_id = u.id JOIN areas ar ON u.area_id = ar.id
      LEFT JOIN floors fl ON ar.floor_id = fl.id LEFT JOIN document_details dd ON dd.user_id = u.id
      WHERE a.date = $1 ORDER BY ${PISO_EXPR}, ar.name, u.first_surname
    `, [fechaConsulta]);
    const { rows: resumen } = await pool.query(`
      SELECT COUNT(*) AS total, SUM((status = 'on_time')::int) AS puntuales, SUM((status = 'late')::int) AS tardanzas,
        SUM((status = 'absent')::int) AS ausentes, SUM((status = 'justified')::int) AS justificados,
        ROUND(SUM((status != 'absent')::int) / COUNT(*) * 100, 1) AS porcentaje_asistencia,
        AVG(late_minutes) AS promedio_tardanza
      FROM attendances WHERE date = $1
    `, [fechaConsulta]);
    res.json({ fecha: fechaConsulta, resumen: resumen[0], registros });
  } catch (err: any) { res.status(500).json({ mensaje: "Error del servidor", error: err.message }); }
};

export const getReporteMensual = async (req: Request, res: Response) => {
  try {
    const { mes, anio } = req.query;
    const mesConsulta  = mes  || new Date().getMonth() + 1;
    const anioConsulta = anio || new Date().getFullYear();

    const { rows: festivos } = await pool.query(
      `SELECT date AS fecha, name AS nombre FROM holidays WHERE active = TRUE
       AND EXTRACT(MONTH FROM date) = $1 AND EXTRACT(YEAR FROM date) = $2`,
      [mesConsulta, anioConsulta]
    );
    const festivosSet = new Set(festivos.map((f: any) => {
      const d = new Date(f.fecha);
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }));
    const festivosMap = Object.fromEntries(festivos.map((f: any) => {
      const d = new Date(f.fecha);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      return [key, f.nombre];
    }));

    const { rows: porDia } = await pool.query(`
      SELECT date AS fecha, COUNT(*) AS total, SUM((status = 'on_time')::int) AS puntuales,
        SUM((status = 'late')::int) AS tardanzas, SUM((status = 'absent')::int) AS ausentes,
        ROUND(SUM((status != 'absent')::int) / COUNT(*) * 100, 1) AS porcentaje_asistencia
      FROM attendances WHERE EXTRACT(MONTH FROM date) = $1 AND EXTRACT(YEAR FROM date) = $2 GROUP BY date ORDER BY date
    `, [mesConsulta, anioConsulta]);

    const porDiaConFestivos = porDia.map((d: any) => {
      const fechaStr = d.fecha instanceof Date
        ? `${d.fecha.getFullYear()}-${String(d.fecha.getMonth()+1).padStart(2,'0')}-${String(d.fecha.getDate()).padStart(2,'0')}`
        : d.fecha.substring(0, 10);
      return { ...d, esFestivo: festivosSet.has(fechaStr), festivo: festivosMap[fechaStr] || null };
    });

    const { rows: porArea } = await pool.query(`
      SELECT ar.name AS area, ${PISO_EXPR} AS piso, COUNT(*) AS total,
        SUM((a.status = 'on_time')::int) AS puntuales, SUM((a.status = 'late')::int) AS tardanzas,
        SUM((a.status = 'absent')::int) AS ausentes,
        ROUND(SUM((a.status != 'absent')::int) / COUNT(*) * 100, 1) AS porcentaje_asistencia
      FROM attendances a JOIN users u ON a.user_id = u.id JOIN areas ar ON u.area_id = ar.id
      LEFT JOIN floors fl ON ar.floor_id = fl.id
      WHERE EXTRACT(MONTH FROM a.date) = $1 AND EXTRACT(YEAR FROM a.date) = $2 GROUP BY ar.id, ar.name, fl.name ORDER BY ${PISO_EXPR}, ar.name
    `, [mesConsulta, anioConsulta]);

    const { rows: resumen } = await pool.query(`
      SELECT COUNT(*) AS total_registros, SUM((status = 'on_time')::int) AS puntuales,
        SUM((status = 'late')::int) AS tardanzas, SUM((status = 'absent')::int) AS ausentes,
        ROUND(SUM((status != 'absent')::int) / COUNT(*) * 100, 1) AS porcentaje_asistencia,
        ROUND(SUM((status = 'on_time')::int) / COUNT(*) * 100, 1) AS porcentaje_puntualidad
      FROM attendances WHERE EXTRACT(MONTH FROM date) = $1 AND EXTRACT(YEAR FROM date) = $2
    `, [mesConsulta, anioConsulta]);

    res.json({
      mes: mesConsulta,
      anio: anioConsulta,
      festivos: festivos.length,
      resumen: { ...resumen[0], festivos: festivos.length },
      porDia: porDiaConFestivos,
      porArea,
    });
  } catch (err: any) { res.status(500).json({ mensaje: "Error del servidor", error: err.message }); }
};

export const getIndicadores = async (req: Request, res: Response) => {
  try {
    const ahora = new Date();
    const mesActual = ahora.getMonth() + 1;
    const anioActual = ahora.getFullYear();
    const mesAnterior = mesActual === 1 ? 12 : mesActual - 1;
    const anioAnterior = mesActual === 1 ? anioActual - 1 : anioActual;

    const { rows: [{ activos }] } = await pool.query(`SELECT COUNT(*) AS activos FROM users WHERE active = TRUE`);
    const { rows: [{ activosAnt }] } = await pool.query(
      `SELECT COUNT(*) AS activos FROM users WHERE active = TRUE AND EXTRACT(YEAR FROM created_at) = $1 AND EXTRACT(MONTH FROM created_at) = $2`,
      [anioAnterior, mesAnterior]
    );

    const { rows: [{ asis }] } = await pool.query(`
      SELECT ROUND(SUM((status != 'absent')::int) / NULLIF(COUNT(*), 0) * 100, 1) AS asis
      FROM attendances WHERE EXTRACT(MONTH FROM date) = $1 AND EXTRACT(YEAR FROM date) = $2
    `, [mesActual, anioActual]);
    const { rows: [{ asisAnt }] } = await pool.query(`
      SELECT ROUND(SUM((status != 'absent')::int) / NULLIF(COUNT(*), 0) * 100, 1) AS asis
      FROM attendances WHERE EXTRACT(MONTH FROM date) = $1 AND EXTRACT(YEAR FROM date) = $2
    `, [mesAnterior, anioAnterior]);

    const { rows: [{ tard }] } = await pool.query(`
      SELECT COUNT(*) AS tard FROM attendances WHERE EXTRACT(MONTH FROM date) = $1 AND EXTRACT(YEAR FROM date) = $2 AND status = 'late'
    `, [mesActual, anioActual]);
    const { rows: [{ tardAnt }] } = await pool.query(`
      SELECT COUNT(*) AS tard FROM attendances WHERE EXTRACT(MONTH FROM date) = $1 AND EXTRACT(YEAR FROM date) = $2 AND status = 'late'
    `, [mesAnterior, anioAnterior]);

    const { rows: [{ inc }] } = await pool.query(`SELECT COUNT(*) AS inc FROM incidents WHERE status = 'pending'`);
    const { rows: [{ incAnt }] } = await pool.query(`
      SELECT COUNT(*) AS inc FROM incidents WHERE status = 'pending' AND EXTRACT(MONTH FROM created_at) = $1 AND EXTRACT(YEAR FROM created_at) = $2
    `, [mesAnterior, anioAnterior]);

    const { rows: [{ aus }] } = await pool.query(`
      SELECT COUNT(*) AS aus FROM attendances WHERE EXTRACT(MONTH FROM date) = $1 AND EXTRACT(YEAR FROM date) = $2 AND status = 'absent'
    `, [mesActual, anioActual]);
    const { rows: [{ ausAnt }] } = await pool.query(`
      SELECT COUNT(*) AS aus FROM attendances WHERE EXTRACT(MONTH FROM date) = $1 AND EXTRACT(YEAR FROM date) = $2 AND status = 'absent'
    `, [mesAnterior, anioAnterior]);

    const { rows: [{ reps }] } = await pool.query(`
      SELECT COUNT(*) AS reps FROM report_history WHERE EXTRACT(MONTH FROM generated_at) = $1 AND EXTRACT(YEAR FROM generated_at) = $2
    `, [mesActual, anioActual]);
    const { rows: [{ repsAnt }] } = await pool.query(`
      SELECT COUNT(*) AS reps FROM report_history WHERE EXTRACT(MONTH FROM generated_at) = $1 AND EXTRACT(YEAR FROM generated_at) = $2
    `, [mesAnterior, anioAnterior]);

    res.json({
      empleados_activos:    { valor: activos, variacion: activos - (activosAnt || activos) },
      asistencia_mes:       { valor: asis || 0, variacion: +((asis || 0) - (asisAnt || 0)).toFixed(1) },
      tardanzas_mes:        { valor: tard || 0, variacion: tard - (tardAnt || tard) },
      incidencias_abiertas: { valor: inc || 0, variacion: inc - (incAnt || inc) },
      ausencias_mes:        { valor: aus || 0, variacion: aus - (ausAnt || aus) },
      reportes_mes:         { valor: reps || 0, variacion: reps - (repsAnt || reps) },
    });
  } catch (err: any) { res.status(500).json({ mensaje: "Error del servidor", error: err.message }); }
};

export const getTendencia = async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`
      SELECT EXTRACT(MONTH FROM date) AS mes, EXTRACT(YEAR FROM date) AS anio,
        ROUND(SUM((status != 'absent')::int) / NULLIF(COUNT(*), 0) * 100, 1) AS porcentaje
      FROM attendances
      WHERE date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '6 months')::date
        AND date <= (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date
      GROUP BY EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date) ORDER BY anio, mes
      LIMIT 6
    `);
    res.json({ tendencia: rows });
  } catch (err: any) { res.status(500).json({ mensaje: "Error del servidor", error: err.message }); }
};

export const getReporteAsistencia = async (req: Request, res: Response) => {
  try {
    const { fecha_desde, fecha_hasta, empleado_id, usuario_id, area_id, estado } = req.query;
    const targetId = usuario_id || empleado_id;
    let query = `
      SELECT a.id, dd.document_number AS cedula, CONCAT(u.first_name, ' ', u.first_surname) AS empleado,
        ar.name AS area, ${PISO_EXPR} AS piso, a.date AS fecha,
        TO_CHAR(a.entry_timestamp, 'HH24:MI') AS entrada1,
        TO_CHAR(a.morning_departure_timestamp, 'HH24:MI') AS salida1,
        TO_CHAR(a.afternoon_entry_timestamp, 'HH24:MI') AS entrada2,
        TO_CHAR(a.departure_timestamp, 'HH24:MI') AS salida2,
        a.worked_hours AS horas_trabajadas, a.late_minutes AS minutos_tardanza, a.mark_type AS tipo_marcacion, a.status AS estado, a.observation AS observacion
      FROM attendances a JOIN users u ON a.user_id = u.id JOIN areas ar ON u.area_id = ar.id
      LEFT JOIN floors fl ON ar.floor_id = fl.id LEFT JOIN document_details dd ON dd.user_id = u.id WHERE 1=1
    `;
    const params: any[] = [];
    if (fecha_desde) { query += ` AND a.date >= $${params.length + 1}`; params.push(fecha_desde); }
    if (fecha_hasta) { query += ` AND a.date <= $${params.length + 1}`; params.push(fecha_hasta); }
    if (targetId) { query += ` AND a.user_id = $${params.length + 1}`; params.push(targetId); }
    if (area_id) { query += ` AND u.area_id = $${params.length + 1}`; params.push(area_id); }
    if (estado) { query += ` AND a.status = $${params.length + 1}`; params.push(estado); }
    query += ` ORDER BY a.date DESC, u.first_surname`;
    const { rows } = await pool.query(query, params);
    res.json({ registros: rows, total: rows.length });
  } catch (err: any) { res.status(500).json({ mensaje: "Error del servidor", error: err.message }); }
};

export const getReporteIncidencias = async (req: Request, res: Response) => {
  try {
    const { fecha_desde, fecha_hasta, estado, tipo, area_id, empleado_id, usuario_id } = req.query;
    const targetId = usuario_id || empleado_id;
    let query = `
      SELECT i.id, i.type AS tipo, i.description AS descripcion, i.evidence AS evidencia_url, i.status AS estado,
        TO_CHAR(i.created_at, 'YYYY-MM-DD') AS fecha,
        CONCAT(u.first_name, ' ', u.first_surname) AS empleado, dd.document_number AS cedula, ar.name AS area, i.rejection_reason AS motivo_rechazo
      FROM incidents i JOIN users u ON i.user_id = u.id JOIN areas ar ON u.area_id = ar.id
      LEFT JOIN document_details dd ON dd.user_id = u.id WHERE 1=1
    `;
    const params: any[] = [];
    if (fecha_desde) { query += ` AND i.created_at >= $${params.length + 1}`; params.push(fecha_desde); }
    if (fecha_hasta) { query += ` AND i.created_at <= $${params.length + 1}`; params.push(fecha_hasta + ' 23:59:59'); }
    if (estado) { query += ` AND i.status = $${params.length + 1}`; params.push(estado); }
    if (tipo) { query += ` AND i.type = $${params.length + 1}`; params.push(tipo); }
    if (area_id) { query += ` AND u.area_id = $${params.length + 1}`; params.push(area_id); }
    if (targetId) { query += ` AND i.user_id = $${params.length + 1}`; params.push(targetId); }
    query += ` ORDER BY i.id ASC`;
    const { rows } = await pool.query(query, params);
    res.json({ registros: rows, total: rows.length });
  } catch (err: any) { res.status(500).json({ mensaje: "Error del servidor", error: err.message }); }
};

export const getReporteTardanzas = async (req: Request, res: Response) => {
  try {
    const { fecha_desde, fecha_hasta, area_id, empleado_id, usuario_id } = req.query;
    const targetId = usuario_id || empleado_id;
    let query = `
      SELECT a.id, dd.document_number AS cedula, CONCAT(u.first_name, ' ', u.first_surname) AS empleado,
        ar.name AS area, ${PISO_EXPR} AS piso, a.date AS fecha,
        TO_CHAR(a.entry_timestamp, 'HH24:MI') AS entrada1,
        TO_CHAR(a.afternoon_entry_timestamp, 'HH24:MI') AS entrada2,
        a.late_minutes AS minutos_tardanza, a.mark_type AS tipo_marcacion, a.observation AS observacion
      FROM attendances a JOIN users u ON a.user_id = u.id JOIN areas ar ON u.area_id = ar.id
      LEFT JOIN floors fl ON ar.floor_id = fl.id LEFT JOIN document_details dd ON dd.user_id = u.id
      WHERE a.status = 'late'
    `;
    const params: any[] = [];
    if (fecha_desde) { query += ` AND a.date >= $${params.length + 1}`; params.push(fecha_desde); }
    if (fecha_hasta) { query += ` AND a.date <= $${params.length + 1}`; params.push(fecha_hasta); }
    if (area_id) { query += ` AND u.area_id = $${params.length + 1}`; params.push(area_id); }
    if (targetId) { query += ` AND a.user_id = $${params.length + 1}`; params.push(targetId); }
    query += ` ORDER BY a.date DESC, a.late_minutes DESC`;
    const { rows } = await pool.query(query, params);
    res.json({ registros: rows, total: rows.length });
  } catch (err: any) { res.status(500).json({ mensaje: "Error del servidor", error: err.message }); }
};

export const getReporteAusencias = async (req: Request, res: Response) => {
  try {
    const { fecha_desde, fecha_hasta, area_id, empleado_id, usuario_id } = req.query;
    const targetId = usuario_id || empleado_id;
    let query = `
      SELECT a.id, dd.document_number AS cedula, CONCAT(u.first_name, ' ', u.first_surname) AS empleado,
        ar.name AS area, ${PISO_EXPR} AS piso, a.date AS fecha, a.status AS estado, a.observation AS observacion, a.mark_type AS tipo_marcacion
      FROM attendances a JOIN users u ON a.user_id = u.id JOIN areas ar ON u.area_id = ar.id
      LEFT JOIN floors fl ON ar.floor_id = fl.id LEFT JOIN document_details dd ON dd.user_id = u.id
      WHERE a.status IN ('absent', 'justified')
        AND NOT EXISTS (
          SELECT 1 FROM news p
          WHERE p.user_id = a.user_id AND a.date BETWEEN p.date_from AND p.date_to
        )
    `;
    const params: any[] = [];
    if (fecha_desde) { query += ` AND a.date >= $${params.length + 1}`; params.push(fecha_desde); }
    if (fecha_hasta) { query += ` AND a.date <= $${params.length + 1}`; params.push(fecha_hasta); }
    if (area_id) { query += ` AND u.area_id = $${params.length + 1}`; params.push(area_id); }
    if (targetId) { query += ` AND a.user_id = $${params.length + 1}`; params.push(targetId); }
    query += ` ORDER BY a.date DESC, u.first_surname`;
    const { rows } = await pool.query(query, params);
    res.json({ registros: rows, total: rows.length });
  } catch (err: any) { res.status(500).json({ mensaje: "Error del servidor", error: err.message }); }
};

export const getReportePorEmpleado = async (req: Request, res: Response) => {
  try {
    const { empleado_id, usuario_id, mes, anio } = req.query;
    const targetId = usuario_id || empleado_id;
    if (!targetId) return res.status(400).json({ mensaje: "usuario_id es requerido" });

    const mesConsulta  = mes  || new Date().getMonth() + 1;
    const anioConsulta = anio || new Date().getFullYear();

    const { rows: [empleado] } = await pool.query(`
      SELECT u.id, dd.document_number AS cedula, u.first_name AS nombre, u.first_surname AS apellido,
        ar.name AS area, ca.name AS cargo,
        TO_CHAR(u.hire_date, 'YYYY-MM-DD') AS fecha_ingreso
      FROM users u LEFT JOIN areas ar ON u.area_id = ar.id LEFT JOIN positions ca ON u.position_id = ca.id
      LEFT JOIN document_details dd ON dd.user_id = u.id
      WHERE u.id = $1
    `, [targetId]);

    if (!empleado) return res.status(404).json({ mensaje: "Empleado no encontrado" });

    const diasDelMes = new Date(anioConsulta as number, mesConsulta as number, 0).getDate();
    let diasHabiles = 0;
    for (let d = 1; d <= diasDelMes; d++) {
      const dia = new Date(anioConsulta as number, (mesConsulta as number) - 1, d);
      if (dia.getDay() !== 0 && dia.getDay() !== 6) diasHabiles++;
    }

    const { rows: festivos } = await pool.query(
      `SELECT COUNT(*) AS total FROM holidays
       WHERE active = TRUE AND EXTRACT(MONTH FROM date) = $1 AND EXTRACT(YEAR FROM date) = $2
       AND EXTRACT(DOW FROM date) != 0 AND EXTRACT(DOW FROM date) != 6`,
      [mesConsulta, anioConsulta]
    );
    const totalFestivos = Number(festivos[0]?.total || 0);
    const diasEsperados = diasHabiles - totalFestivos;

    const { rows: [asis] } = await pool.query(`
      SELECT
        COUNT(*) AS total_registros,
        SUM((status = 'on_time')::int) AS puntuales,
        SUM((status = 'late')::int) AS tardanzas,
        SUM((status = 'absent')::int) AS ausentes,
        SUM((status = 'justified')::int) AS justificados,
        COALESCE(SUM(worked_hours), 0) AS horas_trabajadas,
        COALESCE(SUM(late_minutes), 0) AS total_minutos_tardanza
      FROM attendances
      WHERE user_id = $1 AND EXTRACT(MONTH FROM date) = $2 AND EXTRACT(YEAR FROM date) = $3
    `, [targetId, mesConsulta, anioConsulta]);

    const resumen = asis || { total_registros: 0, puntuales: 0, tardanzas: 0, ausentes: 0, justificados: 0, horas_trabajadas: 0, total_minutos_tardanza: 0 };

    const { rows: permisos } = await pool.query(`
      SELECT COUNT(*) AS total,
        COALESCE(SUM(CASE WHEN mark_type IN ('full_day', 'commission') THEN
          (date_to - date_from + 1) - (
            SELECT COUNT(*) FROM generate_series(date_from::date, date_to::date, '1 day') AS d
            WHERE EXTRACT(DOW FROM d) IN (0, 6)
          )
        ELSE 1 END), 0) AS dias_permiso
      FROM news
      WHERE user_id = $1 AND EXTRACT(MONTH FROM date_from) = $2 AND EXTRACT(YEAR FROM date_from) = $3
    `, [targetId, mesConsulta, anioConsulta]);

    const { rows: [incidencias] } = await pool.query(`
      SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status = 'pending') AS pendientes
      FROM incidents
      WHERE user_id = $1 AND EXTRACT(MONTH FROM date) = $2 AND EXTRACT(YEAR FROM date) = $3
    `, [targetId, mesConsulta, anioConsulta]);

    const { rows: detalle } = await pool.query(`
      SELECT a.date AS fecha, a.status AS estado,
        TO_CHAR(a.entry_timestamp, 'HH24:MI') AS entrada1,
        TO_CHAR(a.morning_departure_timestamp, 'HH24:MI') AS salida1,
        TO_CHAR(a.afternoon_entry_timestamp, 'HH24:MI') AS entrada2,
        TO_CHAR(a.departure_timestamp, 'HH24:MI') AS salida2,
        a.worked_hours AS horas_trabajadas, a.late_minutes AS minutos_tardanza, a.observation AS observacion
      FROM attendances a
      WHERE a.user_id = $1 AND EXTRACT(MONTH FROM a.date) = $2 AND EXTRACT(YEAR FROM a.date) = $3
      ORDER BY a.date DESC
    `, [targetId, mesConsulta, anioConsulta]);

    const { rows: festivosDetalle } = await pool.query(
      `SELECT date AS fecha, name AS nombre FROM holidays WHERE active = TRUE
       AND EXTRACT(MONTH FROM date) = $1 AND EXTRACT(YEAR FROM date) = $2`,
      [mesConsulta, anioConsulta]
    );
    const festivosMapDetalle = Object.fromEntries(festivosDetalle.map((f: any) => {
      const d = new Date(f.fecha);
      return [`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`, f.nombre];
    }));

    const detalleConFestivos = detalle.map((d: any) => {
      const fechaStr = d.fecha instanceof Date
        ? `${d.fecha.getFullYear()}-${String(d.fecha.getMonth()+1).padStart(2,'0')}-${String(d.fecha.getDate()).padStart(2,'0')}`
        : d.fecha.substring(0, 10);
      return { ...d, esFestivo: !!festivosMapDetalle[fechaStr], festivo: festivosMapDetalle[fechaStr] || null };
    });

    const porcentajeAsistencia = diasEsperados > 0
      ? Math.round((Number(resumen.puntuales) / diasEsperados) * 100)
      : 0;

    res.json({
      empleado,
      periodo: { mes: mesConsulta, anio: anioConsulta, diasHabiles, festivos: totalFestivos, diasEsperados },
      resumen: {
        ...resumen,
        puntuales: Number(resumen.puntuales),
        tardanzas: Number(resumen.tardanzas),
        ausentes: Number(resumen.ausentes),
        justificados: Number(resumen.justificados),
        horas_trabajadas: Number(resumen.horas_trabajadas),
        total_minutos_tardanza: Number(resumen.total_minutos_tardanza),
        porcentaje_asistencia: Math.round((Number(resumen.puntuales) + Number(resumen.tardanzas) + Number(resumen.justificados)) / Math.max(diasEsperados, 1) * 100),
        porcentaje_puntualidad: porcentajeAsistencia,
      },
      permisos: { total: Number(permisos[0]?.total || 0), dias: Number(permisos[0]?.dias_permiso || 0) },
      incidencias: { total: Number(incidencias?.total || 0), pendientes: Number(incidencias?.pendientes || 0) },
      detalle: detalleConFestivos,
    });
  } catch (err: any) { res.status(500).json({ mensaje: "Error del servidor", error: err.message }); }
};

export const getReporteEmpleados = async (req: Request, res: Response) => {
  try {
    const { area_id, cargo_id, activo } = req.query;
    let query = `
      SELECT u.id, dd.document_number AS cedula, u.first_name AS nombre, u.first_surname AS apellido, u.email AS correo, u.phone AS telefono,
        ar.name AS area, ca.name AS cargo, u.active AS activo
      FROM users u LEFT JOIN areas ar ON u.area_id = ar.id LEFT JOIN positions ca ON u.position_id = ca.id
      LEFT JOIN document_details dd ON dd.user_id = u.id WHERE 1=1
    `;
    const params: any[] = [];
    if (area_id) { query += ` AND u.area_id = $${params.length + 1}`; params.push(area_id); }
    if (cargo_id) { query += ` AND u.position_id = $${params.length + 1}`; params.push(cargo_id); }
    if (activo !== undefined) { query += ` AND u.active = $${params.length + 1}`; params.push(activo); }
    query += ` ORDER BY u.first_surname, u.first_name`;
    const { rows } = await pool.query(query, params);
    res.json({ registros: rows, total: rows.length });
  } catch (err: any) { res.status(500).json({ mensaje: "Error del servidor", error: err.message }); }
};

export const getReporteMarcaciones = async (req: Request, res: Response) => {
  try {
    const { fecha_desde, fecha_hasta, empleado_id, usuario_id, area_id } = req.query;
    const targetId = usuario_id || empleado_id;
    let query = `
      SELECT a.id, dd.document_number AS cedula, CONCAT(u.first_name, ' ', u.first_surname) AS empleado,
        ar.name AS area, a.date AS fecha,
        TO_CHAR(a.entry_timestamp, 'HH24:MI') AS entrada1,
        TO_CHAR(a.morning_departure_timestamp, 'HH24:MI') AS salida1,
        TO_CHAR(a.afternoon_entry_timestamp, 'HH24:MI') AS entrada2,
        TO_CHAR(a.departure_timestamp, 'HH24:MI') AS salida2,
        a.worked_hours AS horas_trabajadas, a.late_minutes AS minutos_tardanza, a.mark_type AS tipo_marcacion, a.status AS estado
      FROM attendances a JOIN users u ON a.user_id = u.id JOIN areas ar ON u.area_id = ar.id
      LEFT JOIN document_details dd ON dd.user_id = u.id WHERE 1=1
    `;
    const params: any[] = [];
    if (fecha_desde) { query += ` AND a.date >= $${params.length + 1}`; params.push(fecha_desde); }
    if (fecha_hasta) { query += ` AND a.date <= $${params.length + 1}`; params.push(fecha_hasta); }
    if (targetId) { query += ` AND a.user_id = $${params.length + 1}`; params.push(targetId); }
    if (area_id) { query += ` AND u.area_id = $${params.length + 1}`; params.push(area_id); }
    query += ` ORDER BY a.date DESC, a.entry_timestamp DESC`;
    const { rows } = await pool.query(query, params);
    res.json({ registros: rows, total: rows.length });
  } catch (err: any) { res.status(500).json({ mensaje: "Error del servidor", error: err.message }); }
};

export const getHistorial = async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`
      SELECT id, report_type AS tipo_reporte, user_name AS usuario_nombre, generated_at AS fecha_generacion, format AS formato, filters AS filtros, total_records AS total_registros
      FROM report_history ORDER BY generated_at DESC LIMIT 20
    `);
    res.json({ historial: rows });
  } catch (err: any) { res.status(500).json({ mensaje: "Error del servidor", error: err.message }); }
};

export const guardarHistorial = async (req: Request, res: Response) => {
  try {
    const { tipo_reporte, formato, filtros, total_registros } = req.body;
    const usuario_nombre = req.user.nombre || req.user.username || "Desconocido";
    await pool.query(
      `INSERT INTO report_history (report_type, user_name, format, filters, total_records) VALUES ($1, $2, $3, $4, $5)`,
      [tipo_reporte, usuario_nombre, formato, JSON.stringify(filtros || {}), total_registros || 0]
    );
    res.json({ mensaje: "Historial guardado" });
  } catch (err: any) { res.status(500).json({ mensaje: "Error del servidor", error: err.message }); }
};
