const pool = require('../config/db');
const { excluirRolesPorNombre, excluirRolesPorUserId, joinRoles } = require('../services/rolesFiltro');

function statusDisplay(status) {
  if (status === 'on_time') return 'puntual';
  if (status === 'late') return 'tardanza';
  if (status === 'absent') return 'ausente';
  if (status === 'justified') return 'justificado';
  return status || 'puntual';
}

exports.getReporteDiario = async (req, res) => {
  try {
    const { fecha } = req.query;
    const fechaConsulta = fecha || new Date().toISOString().split("T")[0];
    const [registros] = await pool.query(`
      SELECT
        TRIM(CONCAT(e.first_name, ' ', COALESCE(e.middle_name, ''), ' ', e.first_surname, ' ', COALESCE(e.second_surname, ''))) AS empleado,
        COALESCE(dd.document_number, '') AS cedula,
        COALESCE(ar.name, '') AS area,
        COALESCE(fl.name, '') AS piso,
        TO_CHAR(a.date, 'YYYY-MM-DD') AS fecha,
        TO_CHAR(a.entry_timestamp, 'HH24:MI') AS entrada1,
        TO_CHAR(a.morning_departure_timestamp, 'HH24:MI') AS salida1,
        TO_CHAR(a.afternoon_entry_timestamp, 'HH24:MI') AS entrada2,
        TO_CHAR(a.departure_timestamp, 'HH24:MI') AS salida2,
        COALESCE(a.worked_hours, 0) AS horas_trabajadas,
        COALESCE(a.extra_hours, 0) AS horas_extra,
        COALESCE(a.late_minutes, 0) AS minutos_tardanza,
        COALESCE(a.mark_type, 'Web') AS tipo_marcacion,
        COALESCE(a.status, 'on_time') AS estado,
        a.observation AS observacion
      FROM attendances a
      JOIN users e ON a.user_id = e.id
      LEFT JOIN document_details dd ON dd.user_id = e.id
      LEFT JOIN areas ar ON e.area_id = ar.id
      LEFT JOIN floors fl ON ar.floor_id = fl.id
      WHERE a.date = ?::date${excluirRolesPorUserId('a.user_id')}
      ORDER BY fl.name, ar.name, e.first_surname
    `, [fechaConsulta]);

    const [resumen] = await pool.query(`
      SELECT
        COUNT(*) AS total,
        COALESCE(SUM((status = 'on_time')::int), 0) AS puntuales,
        COALESCE(SUM((status = 'late')::int), 0) AS tardanzas,
        COALESCE(SUM((status = 'absent')::int), 0) AS ausentes,
        COALESCE(SUM((status = 'justified')::int), 0) AS justificados,
        CASE WHEN COUNT(*) > 0 THEN ROUND(SUM((status != 'absent')::int)::numeric / COUNT(*) * 100, 1) ELSE 0 END AS porcentaje_asistencia,
        COALESCE(SUM(extra_hours), 0) AS total_horas_extra,
        COALESCE(AVG(late_minutes), 0) AS promedio_tardanza
      FROM attendances
      WHERE date = ?::date${excluirRolesPorUserId('user_id')}
    `, [fechaConsulta]);

    const registrosMapped = (registros || []).map((r) => ({ ...r, estado: statusDisplay(r.estado) }));
    res.json({ fecha: fechaConsulta, resumen: resumen[0] || {}, registros: registrosMapped });
  } catch (err) {
    console.error('getReporteDiario error:', err);
    res.status(500).json({ mensaje: "Error del servidor", error: err.message });
  }
};

exports.getReporteMensual = async (req, res) => {
  try {
    const { mes, anio } = req.query;
    const mesConsulta  = parseInt(mes || (new Date().getMonth() + 1), 10);
    const anioConsulta = parseInt(anio || new Date().getFullYear(), 10);

    // Festivos del mes
    const [festivos] = await pool.query(
      `SELECT TO_CHAR(date, 'YYYY-MM-DD') AS fecha, name AS nombre FROM holidays
       WHERE active = TRUE
       AND EXTRACT(MONTH FROM date) = ? AND EXTRACT(YEAR FROM date) = ?`,
      [mesConsulta, anioConsulta]
    );
    const festivosSet = new Set(festivos.map(f => f.fecha));
    const festivosMap = Object.fromEntries(festivos.map(f => [f.fecha, f.nombre]));

    const [porDia] = await pool.query(`
      SELECT
        TO_CHAR(date, 'YYYY-MM-DD') AS fecha,
        COUNT(*) AS total,
        SUM((status = 'on_time')::int) AS puntuales,
        SUM((status = 'late')::int) AS tardanzas,
        SUM((status = 'absent')::int) AS ausentes,
        ROUND(SUM((status != 'absent')::int)::numeric / GREATEST(COUNT(*), 1) * 100, 1) AS porcentaje_asistencia
      FROM attendances
      WHERE EXTRACT(MONTH FROM date) = ? AND EXTRACT(YEAR FROM date) = ?${excluirRolesPorUserId('user_id')}
      GROUP BY date, TO_CHAR(date, 'YYYY-MM-DD')
      ORDER BY fecha
    `, [mesConsulta, anioConsulta]);

    const porDiaConFestivos = porDia.map(d => ({
      ...d,
      esFestivo: festivosSet.has(d.fecha),
      festivo: festivosMap[d.fecha] || null
    }));

    const [porArea] = await pool.query(`
      SELECT
        ar.name AS area,
        fl.name AS piso,
        COUNT(*) AS total,
        SUM((a.status = 'on_time')::int) AS puntuales,
        SUM((a.status = 'late')::int) AS tardanzas,
        SUM((a.status = 'absent')::int) AS ausentes,
        ROUND(SUM((a.status != 'absent')::int)::numeric / GREATEST(COUNT(*), 1) * 100, 1) AS porcentaje_asistencia
      FROM attendances a
      JOIN users e ON a.user_id = e.id
      JOIN areas ar ON e.area_id = ar.id
      LEFT JOIN floors fl ON ar.floor_id = fl.id
      WHERE EXTRACT(MONTH FROM a.date) = ? AND EXTRACT(YEAR FROM a.date) = ?${excluirRolesPorUserId('a.user_id')}
      GROUP BY ar.id, ar.name, fl.name
      ORDER BY fl.name, ar.name
    `, [mesConsulta, anioConsulta]);

    const [resumen] = await pool.query(`
      SELECT
        COUNT(*) AS total_registros,
        SUM((status = 'on_time')::int) AS puntuales,
        SUM((status = 'late')::int) AS tardanzas,
        SUM((status = 'absent')::int) AS ausentes,
        COALESCE(SUM(extra_hours), 0) AS total_horas_extra,
        ROUND(SUM((status != 'absent')::int)::numeric / GREATEST(COUNT(*), 1) * 100, 1) AS porcentaje_asistencia,
        ROUND(SUM((status = 'on_time')::int)::numeric / GREATEST(COUNT(*), 1) * 100, 1) AS porcentaje_puntualidad
      FROM attendances
      WHERE EXTRACT(MONTH FROM date) = ? AND EXTRACT(YEAR FROM date) = ?${excluirRolesPorUserId('user_id')}
    `, [mesConsulta, anioConsulta]);

    res.json({
      mes: mesConsulta,
      anio: anioConsulta,
      festivos: festivos.length,
      resumen: { ...(resumen[0] || {}), festivos: festivos.length },
      porDia: porDiaConFestivos,
      porArea,
    });
  } catch (err) {
    console.error('getReporteMensual error:', err);
    res.status(500).json({ mensaje: "Error del servidor", error: err.message });
  }
};

exports.getIndicadores = async (req, res) => {
  try {
    const ahora = new Date();
    const mesActual = ahora.getMonth() + 1;
    const anioActual = ahora.getFullYear();
    const mesAnterior = mesActual === 1 ? 12 : mesActual - 1;
    const anioAnterior = mesActual === 1 ? anioActual - 1 : anioActual;

    const [[{ activos }]] = await pool.query(`SELECT COUNT(*) AS activos FROM users WHERE 1=1${excluirRolesPorUserId('id')}`);
    const [[{ activosAnt }]] = await pool.query(
      `SELECT COUNT(*) AS activos FROM users WHERE EXTRACT(YEAR FROM created_at) = ? AND EXTRACT(MONTH FROM created_at) = ?${excluirRolesPorUserId('id')}`,
      [anioAnterior, mesAnterior]
    );

    const [[{ asis }]] = await pool.query(`
      SELECT ROUND(SUM((status != 'absent')::int)::numeric / NULLIF(COUNT(*), 0) * 100, 1) AS asis
      FROM attendances WHERE EXTRACT(MONTH FROM date) = ? AND EXTRACT(YEAR FROM date) = ?${excluirRolesPorUserId('user_id')}
    `, [mesActual, anioActual]);
    const [[{ asisAnt }]] = await pool.query(`
      SELECT ROUND(SUM((status != 'absent')::int)::numeric / NULLIF(COUNT(*), 0) * 100, 1) AS asis
      FROM attendances WHERE EXTRACT(MONTH FROM date) = ? AND EXTRACT(YEAR FROM date) = ?${excluirRolesPorUserId('user_id')}
    `, [mesAnterior, anioAnterior]);

    const [[{ tard }]] = await pool.query(`
      SELECT COUNT(*) AS tard FROM attendances WHERE EXTRACT(MONTH FROM date) = ? AND EXTRACT(YEAR FROM date) = ?${excluirRolesPorUserId('user_id')} AND status = 'late'
    `, [mesActual, anioActual]);
    const [[{ tardAnt }]] = await pool.query(`
      SELECT COUNT(*) AS tard FROM attendances WHERE EXTRACT(MONTH FROM date) = ? AND EXTRACT(YEAR FROM date) = ?${excluirRolesPorUserId('user_id')} AND status = 'late'
    `, [mesAnterior, anioAnterior]);

    const [[{ inc }]] = await pool.query(`SELECT COUNT(*) AS inc FROM incidents WHERE status = 'pending'${excluirRolesPorUserId('user_id')}`);
    const [[{ incAnt }]] = await pool.query(`
      SELECT COUNT(*) AS inc FROM incidents WHERE status = 'pending' AND EXTRACT(MONTH FROM created_at) = ? AND EXTRACT(YEAR FROM created_at) = ?${excluirRolesPorUserId('user_id')}
    `, [mesAnterior, anioAnterior]);

    const [[{ aus }]] = await pool.query(`
      SELECT COUNT(*) AS aus FROM attendances WHERE EXTRACT(MONTH FROM date) = ? AND EXTRACT(YEAR FROM date) = ?${excluirRolesPorUserId('user_id')} AND status = 'absent'
    `, [mesActual, anioActual]);
    const [[{ ausAnt }]] = await pool.query(`
      SELECT COUNT(*) AS aus FROM attendances WHERE EXTRACT(MONTH FROM date) = ? AND EXTRACT(YEAR FROM date) = ?${excluirRolesPorUserId('user_id')} AND status = 'absent'
    `, [mesAnterior, anioAnterior]);

    const [[{ reps }]] = await pool.query(`
      SELECT COUNT(*) AS reps FROM report_history WHERE EXTRACT(MONTH FROM generated_at) = ? AND EXTRACT(YEAR FROM generated_at) = ?
    `, [mesActual, anioActual]);
    const [[{ repsAnt }]] = await pool.query(`
      SELECT COUNT(*) AS reps FROM report_history WHERE EXTRACT(MONTH FROM generated_at) = ? AND EXTRACT(YEAR FROM generated_at) = ?
    `, [mesAnterior, anioAnterior]);

    res.json({
      empleados_activos:    { valor: Number(activos), variacion: Number(activos) - (Number(activosAnt) || Number(activos)) },
      asistencia_mes:       { valor: asis || 0, variacion: +((asis || 0) - (asisAnt || 0)).toFixed(1) },
      tardanzas_mes:        { valor: Number(tard) || 0, variacion: Number(tard) - (Number(tardAnt) || Number(tard)) },
      incidencias_abiertas: { valor: Number(inc) || 0, variacion: Number(inc) - (Number(incAnt) || Number(inc)) },
      ausencias_mes:        { valor: Number(aus) || 0, variacion: Number(aus) - (Number(ausAnt) || Number(aus)) },
      reportes_mes:         { valor: Number(reps) || 0, variacion: Number(reps) - (Number(repsAnt) || Number(reps)) },
    });
  } catch (err) {
    console.error('getIndicadores error:', err);
    res.status(500).json({ mensaje: "Error del servidor", error: err.message });
  }
};

exports.getTendencia = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        EXTRACT(MONTH FROM date) AS mes,
        EXTRACT(YEAR FROM date) AS anio,
        ROUND(SUM((status != 'absent')::int)::numeric / NULLIF(COUNT(*), 0) * 100, 1) AS porcentaje
      FROM attendances
      WHERE date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '6 months')
        AND date <= (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')${excluirRolesPorUserId('user_id')}
      GROUP BY EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date)
      ORDER BY anio, mes
      LIMIT 6
    `);
    res.json({ tendencia: rows });
  } catch (err) {
    console.error('getTendencia error:', err);
    res.status(500).json({ mensaje: "Error del servidor", error: err.message });
  }
};

exports.getReporteAsistencia = async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta, empleado_id, area_id, estado } = req.query;
    let query = `
      SELECT
        a.id,
        COALESCE(dd.document_number, '') AS cedula,
        TRIM(CONCAT(e.first_name, ' ', e.first_surname)) AS empleado,
        COALESCE(ar.name, '') AS area,
        COALESCE(fl.name, '') AS piso,
        TO_CHAR(a.date, 'YYYY-MM-DD') AS fecha,
        TO_CHAR(a.entry_timestamp, 'HH24:MI') AS entrada1,
        TO_CHAR(a.morning_departure_timestamp, 'HH24:MI') AS salida1,
        TO_CHAR(a.afternoon_entry_timestamp, 'HH24:MI') AS entrada2,
        TO_CHAR(a.departure_timestamp, 'HH24:MI') AS salida2,
        COALESCE(a.worked_hours, 0) AS horas_trabajadas,
        COALESCE(a.extra_hours, 0) AS horas_extra,
        COALESCE(a.late_minutes, 0) AS minutos_tardanza,
        COALESCE(a.mark_type, 'Web') AS tipo_marcacion,
        COALESCE(a.status, 'on_time') AS estado,
        a.observation AS observacion
      FROM attendances a
      JOIN users e ON a.user_id = e.id
      LEFT JOIN document_details dd ON dd.user_id = e.id
      LEFT JOIN areas ar ON e.area_id = ar.id
      LEFT JOIN floors fl ON ar.floor_id = fl.id${joinRoles('e.id')}
      WHERE 1=1${excluirRolesPorNombre('r')}
    `;
    const params = [];
    if (fecha_desde) { query += ` AND a.date >= ?::date`; params.push(fecha_desde); }
    if (fecha_hasta) { query += ` AND a.date <= ?::date`; params.push(fecha_hasta); }
    if (empleado_id) { query += ` AND a.user_id = ?`; params.push(empleado_id); }
    if (area_id) { query += ` AND e.area_id = ?`; params.push(area_id); }
    if (estado) { query += ` AND a.status = ?`; params.push(estado); }
    query += ` ORDER BY a.date DESC, e.first_surname`;
    const [rows] = await pool.query(query, params);
    const registros = rows.map((r) => ({ ...r, estado: statusDisplay(r.estado) }));
    res.json({ registros, total: rows.length });
  } catch (err) {
    console.error('getReporteAsistencia error:', err);
    res.status(500).json({ mensaje: "Error del servidor", error: err.message });
  }
};

exports.getReporteIncidencias = async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta, estado, tipo, area_id } = req.query;
    let query = `
      SELECT
        i.id,
        i.type AS tipo,
        i.description AS descripcion,
        i.evidence AS evidencia_url,
        i.status AS estado,
        TO_CHAR(i.created_at, 'YYYY-MM-DD') AS fecha,
        TRIM(CONCAT(e.first_name, ' ', e.first_surname)) AS empleado,
        COALESCE(dd.document_number, '') AS cedula,
        COALESCE(ar.name, '') AS area,
        i.rejection_reason AS motivo_rechazo
      FROM incidents i
      JOIN users e ON i.user_id = e.id
      LEFT JOIN document_details dd ON dd.user_id = e.id
      LEFT JOIN areas ar ON e.area_id = ar.id
      WHERE 1=1${excluirRolesPorUserId('i.user_id')}
    `;
    const params = [];
    if (fecha_desde) { query += ` AND DATE(i.created_at) >= ?`; params.push(fecha_desde); }
    if (fecha_hasta) { query += ` AND DATE(i.created_at) <= ?`; params.push(fecha_hasta); }
    if (estado) { query += ` AND LOWER(i.status) = LOWER(?)`; params.push(estado); }
    if (tipo) { query += ` AND LOWER(i.type) = LOWER(?)`; params.push(tipo); }
    if (area_id) { query += ` AND e.area_id = ?`; params.push(area_id); }
    query += ` ORDER BY i.created_at DESC`;
    const [rows] = await pool.query(query, params);
    const registros = rows.map((r) => ({ ...r, estado: r.estado === 'pending' ? 'pendiente' : r.estado === 'approved' ? 'aprobada' : r.estado === 'rejected' ? 'rechazada' : r.estado }));
    res.json({ registros, total: rows.length });
  } catch (err) {
    console.error('getReporteIncidencias error:', err);
    res.status(500).json({ mensaje: "Error del servidor", error: err.message });
  }
};

exports.getReporteTardanzas = async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta, area_id, empleado_id } = req.query;
    let query = `
      SELECT
        a.id,
        COALESCE(dd.document_number, '') AS cedula,
        TRIM(CONCAT(e.first_name, ' ', e.first_surname)) AS empleado,
        COALESCE(ar.name, '') AS area,
        COALESCE(fl.name, '') AS piso,
        TO_CHAR(a.date, 'YYYY-MM-DD') AS fecha,
        TO_CHAR(a.entry_timestamp, 'HH24:MI') AS entrada1,
        TO_CHAR(a.afternoon_entry_timestamp, 'HH24:MI') AS entrada2,
        COALESCE(a.late_minutes, 0) AS minutos_tardanza,
        COALESCE(a.mark_type, 'Web') AS tipo_marcacion,
        a.observation AS observacion
      FROM attendances a
      JOIN users e ON a.user_id = e.id
      LEFT JOIN document_details dd ON dd.user_id = e.id
      LEFT JOIN areas ar ON e.area_id = ar.id
      LEFT JOIN floors fl ON ar.floor_id = fl.id
      WHERE a.status = 'late'${excluirRolesPorUserId('a.user_id')}
    `;
    const params = [];
    if (fecha_desde) { query += ` AND a.date >= ?::date`; params.push(fecha_desde); }
    if (fecha_hasta) { query += ` AND a.date <= ?::date`; params.push(fecha_hasta); }
    if (area_id) { query += ` AND e.area_id = ?`; params.push(area_id); }
    if (empleado_id) { query += ` AND a.user_id = ?`; params.push(empleado_id); }
    query += ` ORDER BY a.date DESC, a.late_minutes DESC`;
    const [rows] = await pool.query(query, params);
    res.json({ registros: rows, total: rows.length });
  } catch (err) {
    console.error('getReporteTardanzas error:', err);
    res.status(500).json({ mensaje: "Error del servidor", error: err.message });
  }
};

exports.getReporteAusencias = async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta, area_id, empleado_id } = req.query;
    let query = `
      SELECT
        a.id,
        COALESCE(dd.document_number, '') AS cedula,
        TRIM(CONCAT(e.first_name, ' ', e.first_surname)) AS empleado,
        COALESCE(ar.name, '') AS area,
        COALESCE(fl.name, '') AS piso,
        TO_CHAR(a.date, 'YYYY-MM-DD') AS fecha,
        a.status AS estado,
        a.observation AS observacion,
        COALESCE(a.mark_type, 'Web') AS tipo_marcacion
      FROM attendances a
      JOIN users e ON a.user_id = e.id
      LEFT JOIN document_details dd ON dd.user_id = e.id
      LEFT JOIN areas ar ON e.area_id = ar.id
      LEFT JOIN floors fl ON ar.floor_id = fl.id
      WHERE a.status IN ('absent', 'justified')${excluirRolesPorUserId('a.user_id')}
    `;
    const params = [];
    if (fecha_desde) { query += ` AND a.date >= ?::date`; params.push(fecha_desde); }
    if (fecha_hasta) { query += ` AND a.date <= ?::date`; params.push(fecha_hasta); }
    if (area_id) { query += ` AND e.area_id = ?`; params.push(area_id); }
    if (empleado_id) { query += ` AND a.user_id = ?`; params.push(empleado_id); }
    query += ` ORDER BY a.date DESC, e.first_surname`;
    const [rows] = await pool.query(query, params);
    const registros = rows.map((r) => ({ ...r, estado: statusDisplay(r.estado) }));
    res.json({ registros, total: rows.length });
  } catch (err) {
    console.error('getReporteAusencias error:', err);
    res.status(500).json({ mensaje: "Error del servidor", error: err.message });
  }
};

exports.getReportePorEmpleado = async (req, res) => {
  try {
    const { empleado_id, mes, anio } = req.query;
    if (!empleado_id) return res.status(400).json({ mensaje: "empleado_id es requerido" });

    const mesConsulta  = parseInt(mes || (new Date().getMonth() + 1), 10);
    const anioConsulta = parseInt(anio || new Date().getFullYear(), 10);

    const [empleadoRows] = await pool.query(`
      SELECT
        e.id,
        COALESCE(dd.document_number, '') AS cedula,
        e.first_name AS nombre,
        e.first_surname AS apellido,
        COALESCE(ar.name, '') AS area,
        COALESCE(ca.name, '') AS cargo,
        TO_CHAR(e.created_at, 'YYYY-MM-DD') AS fecha_ingreso
      FROM users e
      LEFT JOIN document_details dd ON dd.user_id = e.id
      LEFT JOIN areas ar ON e.area_id = ar.id
      LEFT JOIN positions ca ON e.position_id = ca.id
      WHERE e.id = ?${excluirRolesPorUserId('e.id')}
    `, [empleado_id]);

    const empleado = empleadoRows[0];
    if (!empleado) return res.status(404).json({ mensaje: "Empleado no encontrado" });

    const diasDelMes = new Date(anioConsulta, mesConsulta, 0).getDate();
    let diasHabiles = 0;
    for (let d = 1; d <= diasDelMes; d++) {
      const dia = new Date(anioConsulta, mesConsulta - 1, d);
      if (dia.getDay() !== 0 && dia.getDay() !== 6) diasHabiles++;
    }

    const [festivos] = await pool.query(
      `SELECT COUNT(*) AS total FROM holidays
       WHERE active = TRUE AND EXTRACT(MONTH FROM date) = ? AND EXTRACT(YEAR FROM date) = ?
       AND EXTRACT(DOW FROM date) != 0 AND EXTRACT(DOW FROM date) != 6`,
      [mesConsulta, anioConsulta]
    );
    const totalFestivos = Number(festivos[0]?.total || 0);
    const diasEsperados = Math.max(diasHabiles - totalFestivos, 1);

    const [asisRows] = await pool.query(`
      SELECT
        COUNT(*) AS total_registros,
        SUM((status = 'on_time')::int) AS puntuales,
        SUM((status = 'late')::int) AS tardanzas,
        SUM((status = 'absent')::int) AS ausentes,
        SUM((status = 'justified')::int) AS justificados,
        COALESCE(SUM(worked_hours), 0) AS horas_trabajadas,
        COALESCE(SUM(extra_hours), 0) AS horas_extra,
        COALESCE(SUM(late_minutes), 0) AS total_minutos_tardanza
      FROM attendances
      WHERE user_id = ? AND EXTRACT(MONTH FROM date) = ? AND EXTRACT(YEAR FROM date) = ?${excluirRolesPorUserId('user_id')}
    `, [empleado_id, mesConsulta, anioConsulta]);

    const resumen = asisRows[0] || { total_registros: 0, puntuales: 0, tardanzas: 0, ausentes: 0, justificados: 0, horas_trabajadas: 0, horas_extra: 0, total_minutos_tardanza: 0 };

    const [permisos] = await pool.query(`
      SELECT COUNT(*) AS total, COALESCE(SUM(1), 0) AS dias_permiso
      FROM news
      WHERE user_id = ? AND status = 'approved' AND EXTRACT(MONTH FROM date_from) = ? AND EXTRACT(YEAR FROM date_from) = ?${excluirRolesPorUserId('user_id')}
    `, [empleado_id, mesConsulta, anioConsulta]);

    const [incidencias] = await pool.query(`
      SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status = 'pending') AS pendientes
      FROM incidents
      WHERE user_id = ? AND EXTRACT(MONTH FROM created_at) = ? AND EXTRACT(YEAR FROM created_at) = ?${excluirRolesPorUserId('user_id')}
    `, [empleado_id, mesConsulta, anioConsulta]);

    const [detalle] = await pool.query(`
      SELECT
        TO_CHAR(a.date, 'YYYY-MM-DD') AS fecha,
        a.status AS estado,
        TO_CHAR(a.entry_timestamp, 'HH24:MI') AS entrada1,
        TO_CHAR(a.morning_departure_timestamp, 'HH24:MI') AS salida1,
        TO_CHAR(a.afternoon_entry_timestamp, 'HH24:MI') AS entrada2,
        TO_CHAR(a.departure_timestamp, 'HH24:MI') AS salida2,
        a.worked_hours AS horas_trabajadas,
        a.extra_hours AS horas_extra,
        a.late_minutes AS minutos_tardanza,
        a.observation AS observacion
      FROM attendances a
      WHERE a.user_id = ? AND EXTRACT(MONTH FROM a.date) = ? AND EXTRACT(YEAR FROM a.date) = ?${excluirRolesPorUserId('a.user_id')}
      ORDER BY a.date DESC
    `, [empleado_id, mesConsulta, anioConsulta]);

    const [festivosDetalle] = await pool.query(
      `SELECT TO_CHAR(date, 'YYYY-MM-DD') AS fecha, name AS nombre FROM holidays
       WHERE active = TRUE AND EXTRACT(MONTH FROM date) = ? AND EXTRACT(YEAR FROM date) = ?`,
      [mesConsulta, anioConsulta]
    );
    const festivosMap = Object.fromEntries(festivosDetalle.map(f => [f.fecha, f.nombre]));

    const detalleConFestivos = detalle.map(d => ({
      ...d,
      estado: statusDisplay(d.estado),
      esFestivo: Boolean(festivosMap[d.fecha]),
      festivo: festivosMap[d.fecha] || null
    }));

    const porcentajePuntualidad = Math.round((Number(resumen.puntuales || 0) / diasEsperados) * 100);

    res.json({
      empleado,
      periodo: { mes: mesConsulta, anio: anioConsulta, diasHabiles, festivos: totalFestivos, diasEsperados },
      resumen: {
        ...resumen,
        puntuales: Number(resumen.puntuales || 0),
        tardanzas: Number(resumen.tardanzas || 0),
        ausentes: Number(resumen.ausentes || 0),
        justificados: Number(resumen.justificados || 0),
        horas_trabajadas: Number(resumen.horas_trabajadas || 0),
        horas_extra: Number(resumen.horas_extra || 0),
        total_minutos_tardanza: Number(resumen.total_minutos_tardanza || 0),
        porcentaje_asistencia: Math.round((Number(resumen.puntuales || 0) + Number(resumen.tardanzas || 0) + Number(resumen.justificados || 0)) / diasEsperados * 100),
        porcentaje_puntualidad: porcentajePuntualidad,
      },
      permisos: { total: Number(permisos[0]?.total || 0), dias: Number(permisos[0]?.dias_permiso || 0) },
      incidencias: { total: Number(incidencias[0]?.total || 0), pendientes: Number(incidencias[0]?.pendientes || 0) },
      detalle: detalleConFestivos,
    });
  } catch (err) {
    console.error('getReportePorEmpleado error:', err);
    res.status(500).json({ mensaje: "Error del servidor", error: err.message });
  }
};

exports.getReporteEmpleados = async (req, res) => {
  try {
    const { area_id, cargo_id } = req.query;
    let query = `
      SELECT
        e.id,
        COALESCE(dd.document_number, '') AS cedula,
        e.first_name AS nombre,
        e.first_surname AS apellido,
        e.email AS correo,
        COALESCE(e.phone, '') AS telefono,
        COALESCE(ar.name, '') AS area,
        COALESCE(ca.name, '') AS cargo,
        1 AS activo
      FROM users e
      LEFT JOIN document_details dd ON dd.user_id = e.id
      LEFT JOIN areas ar ON e.area_id = ar.id
      LEFT JOIN positions ca ON e.position_id = ca.id
      WHERE 1=1${excluirRolesPorUserId('e.id')}
    `;
    const params = [];
    if (area_id) { query += ` AND e.area_id = ?`; params.push(area_id); }
    if (cargo_id) { query += ` AND e.position_id = ?`; params.push(cargo_id); }
    query += ` ORDER BY e.first_surname, e.first_name`;
    const [rows] = await pool.query(query, params);
    res.json({ registros: rows, total: rows.length });
  } catch (err) {
    console.error('getReporteEmpleados error:', err);
    res.status(500).json({ mensaje: "Error del servidor", error: err.message });
  }
};

exports.getReporteMarcaciones = async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta, empleado_id, area_id } = req.query;
    let query = `
      SELECT
        a.id,
        COALESCE(dd.document_number, '') AS cedula,
        TRIM(CONCAT(e.first_name, ' ', e.first_surname)) AS empleado,
        COALESCE(ar.name, '') AS area,
        TO_CHAR(a.date, 'YYYY-MM-DD') AS fecha,
        TO_CHAR(a.entry_timestamp, 'HH24:MI') AS entrada1,
        TO_CHAR(a.morning_departure_timestamp, 'HH24:MI') AS salida1,
        TO_CHAR(a.afternoon_entry_timestamp, 'HH24:MI') AS entrada2,
        TO_CHAR(a.departure_timestamp, 'HH24:MI') AS salida2,
        COALESCE(a.worked_hours, 0) AS horas_trabajadas,
        COALESCE(a.extra_hours, 0) AS horas_extra,
        COALESCE(a.late_minutes, 0) AS minutos_tardanza,
        COALESCE(a.mark_type, 'Web') AS tipo_marcacion,
        COALESCE(a.status, 'on_time') AS estado
      FROM attendances a
      JOIN users e ON a.user_id = e.id
      LEFT JOIN document_details dd ON dd.user_id = e.id
      LEFT JOIN areas ar ON e.area_id = ar.id
      WHERE 1=1${excluirRolesPorUserId('a.user_id')}
    `;
    const params = [];
    if (fecha_desde) { query += ` AND a.date >= ?::date`; params.push(fecha_desde); }
    if (fecha_hasta) { query += ` AND a.date <= ?::date`; params.push(fecha_hasta); }
    if (empleado_id) { query += ` AND a.user_id = ?`; params.push(empleado_id); }
    if (area_id) { query += ` AND e.area_id = ?`; params.push(area_id); }
    query += ` ORDER BY a.date DESC, a.entry_timestamp DESC`;
    const [rows] = await pool.query(query, params);
    const registros = rows.map((r) => ({ ...r, estado: statusDisplay(r.estado) }));
    res.json({ registros, total: rows.length });
  } catch (err) {
    console.error('getReporteMarcaciones error:', err);
    res.status(500).json({ mensaje: "Error del servidor", error: err.message });
  }
};

exports.getReportePorAreas = async (req, res) => {
  try {
    const { area_id, empleado_id, usuario_id, mes, anio, estado } = req.query;
    const targetId = usuario_id || empleado_id;
    let query = `
      SELECT u.id, CONCAT(u.first_name, ' ', u.first_surname) AS empleado, dd.document_number AS cedula, ar.name AS area,
        (COUNT(DISTINCT a.date) FILTER (WHERE a.status IN ('on_time','late')))::int AS dias_laborados,
        (COUNT(*) FILTER (WHERE a.status = 'on_time'))::int AS puntuales,
        (COUNT(*) FILTER (WHERE a.status = 'late'))::int AS tardanzas,
        (COUNT(*) FILTER (WHERE a.status = 'absent'))::int AS ausencias,
        COALESCE(SUM(a.worked_hours), 0)::float AS horas_trabajadas
      FROM users u
      LEFT JOIN areas ar ON u.area_id = ar.id
      LEFT JOIN document_details dd ON dd.user_id = u.id
      LEFT JOIN attendances a ON a.user_id = u.id${joinRoles('u.id')}
    `;
    const params = [];
    // mes/anio van en el ON del LEFT JOIN para que los empleados sin marcas sigan apareciendo (ceros)
    const joinConds = [];
    if (mes) { joinConds.push(`EXTRACT(MONTH FROM a.date) = ?`); params.push(mes); }
    if (anio) { joinConds.push(`EXTRACT(YEAR FROM a.date) = ?`); params.push(anio); }
    if (joinConds.length) { query += ` AND ${joinConds.join(" AND ")}`; }
    query += ` WHERE u.active = true${excluirRolesPorNombre('r')}`;
    if (area_id) { query += ` AND u.area_id = ?`; params.push(area_id); }
    if (targetId) { query += ` AND u.id = ?`; params.push(targetId); }
    query += ` GROUP BY u.id, u.first_name, u.first_surname, dd.document_number, ar.name`;
    const ESTADO_HAVING = {
      on_time: "COUNT(*) FILTER (WHERE a.status = 'late') = 0 AND COUNT(*) FILTER (WHERE a.status = 'on_time') > 0",
      late: "COUNT(*) FILTER (WHERE a.status = 'late') > 0",
      absent: "COUNT(*) FILTER (WHERE a.status = 'absent') > 0",
      justified: "COUNT(*) FILTER (WHERE a.status = 'justified') > 0",
    };
    if (estado && ESTADO_HAVING[String(estado)]) { query += ` HAVING ${ESTADO_HAVING[String(estado)]}`; }
    query += ` ORDER BY u.first_surname, u.first_name`;
    const [rows] = await pool.query(query, params);
    res.json({ registros: rows, total: rows.length });
  } catch (err) {
    console.error('getReportePorAreas error:', err);
    res.status(500).json({ mensaje: "Error del servidor", error: err.message });
  }
};

exports.getHistorial = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, report_type AS tipo_reporte, user_name AS usuario_nombre, generated_at AS fecha_generacion, format AS formato, filters AS filtros, total_records AS total_registros
      FROM report_history ORDER BY generated_at DESC LIMIT 20
    `);
    res.json({ historial: rows });
  } catch (err) {
    console.error('getHistorial error:', err);
    res.status(500).json({ mensaje: "Error del servidor", error: err.message });
  }
};

exports.guardarHistorial = async (req, res) => {
  try {
    const tipo_reporte = req.body.tipo_reporte || req.body.tipo || "General";
    const { formato, filtros, total_registros } = req.body;
    const usuario_nombre = req.user?.nombre || req.user?.username || "Desconocido";
    await pool.query(
      `INSERT INTO report_history (report_type, user_name, format, filters, total_records) VALUES (?, ?, ?, ?, ?)`,
      [tipo_reporte, usuario_nombre, formato || 'PDF', JSON.stringify(filtros || {}), total_registros || 0]
    );
    res.json({ mensaje: "Historial guardado" });
  } catch (err) {
    console.error('guardarHistorial error:', err);
    res.status(500).json({ mensaje: "Error del servidor", error: err.message });
  }
};
