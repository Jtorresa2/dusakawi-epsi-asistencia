const pool = require('../config/db');

exports.getReporteDiario = async (req, res) => {
  try {
    const { fecha } = req.query;
    const fechaConsulta = fecha || new Date().toISOString().split("T")[0];
    const [registros] = await pool.query(`
      SELECT CONCAT(e.nombre, ' ', e.apellido) AS empleado, e.cedula,
        ar.nombre AS area, ar.piso, a.fecha,
        TIME_FORMAT(a.fecha_hora_entrada, '%H:%i') AS entrada1,
        TIME_FORMAT(a.fecha_hora_salida_manana, '%H:%i') AS salida1,
        TIME_FORMAT(a.fecha_hora_entrada_tarde, '%H:%i') AS entrada2,
        TIME_FORMAT(a.fecha_hora_salida, '%H:%i') AS salida2,
        a.horas_trabajadas, a.horas_extra, a.minutos_tardanza, a.tipo_marcacion, a.estado, a.observacion
      FROM asistencia a JOIN empleado e ON a.empleado_id = e.id JOIN areas ar ON e.area_id = ar.id
      WHERE a.fecha = ? ORDER BY ar.piso, ar.nombre, e.apellido
    `, [fechaConsulta]);
    const [resumen] = await pool.query(`
      SELECT COUNT(*) AS total, SUM(estado = 'puntual') AS puntuales, SUM(estado = 'tardanza') AS tardanzas,
        SUM(estado = 'ausente') AS ausentes, SUM(estado = 'justificado') AS justificados,
        ROUND(SUM(estado != 'ausente') / COUNT(*) * 100, 1) AS porcentaje_asistencia,
        SUM(horas_extra) AS total_horas_extra, AVG(minutos_tardanza) AS promedio_tardanza
      FROM asistencia WHERE fecha = ?
    `, [fechaConsulta]);
    res.json({ fecha: fechaConsulta, resumen: resumen[0], registros });
  } catch (err) { res.status(500).json({ mensaje: "Error del servidor", error: err.message }); }
};

exports.getReporteMensual = async (req, res) => {
  try {
    const { mes, anio } = req.query;
    const mesConsulta  = mes  || new Date().getMonth() + 1;
    const anioConsulta = anio || new Date().getFullYear();
    const [porDia] = await pool.query(`
      SELECT fecha, COUNT(*) AS total, SUM(estado = 'puntual') AS puntuales,
        SUM(estado = 'tardanza') AS tardanzas, SUM(estado = 'ausente') AS ausentes,
        ROUND(SUM(estado != 'ausente') / COUNT(*) * 100, 1) AS porcentaje_asistencia
      FROM asistencia WHERE MONTH(fecha) = ? AND YEAR(fecha) = ? GROUP BY fecha ORDER BY fecha
    `, [mesConsulta, anioConsulta]);
    const [porArea] = await pool.query(`
      SELECT ar.nombre AS area, ar.piso, COUNT(*) AS total,
        SUM(a.estado = 'puntual') AS puntuales, SUM(a.estado = 'tardanza') AS tardanzas,
        SUM(a.estado = 'ausente') AS ausentes,
        ROUND(SUM(a.estado != 'ausente') / COUNT(*) * 100, 1) AS porcentaje_asistencia
      FROM asistencia a JOIN empleado e ON a.empleado_id = e.id JOIN areas ar ON e.area_id = ar.id
      WHERE MONTH(a.fecha) = ? AND YEAR(a.fecha) = ? GROUP BY ar.id ORDER BY ar.piso, ar.nombre
    `, [mesConsulta, anioConsulta]);
    const [resumen] = await pool.query(`
      SELECT COUNT(*) AS total_registros, SUM(estado = 'puntual') AS puntuales,
        SUM(estado = 'tardanza') AS tardanzas, SUM(estado = 'ausente') AS ausentes,
        SUM(horas_extra) AS total_horas_extra,
        ROUND(SUM(estado != 'ausente') / COUNT(*) * 100, 1) AS porcentaje_asistencia,
        ROUND(SUM(estado = 'puntual') / COUNT(*) * 100, 1) AS porcentaje_puntualidad
      FROM asistencia WHERE MONTH(fecha) = ? AND YEAR(fecha) = ?
    `, [mesConsulta, anioConsulta]);
    res.json({ mes: mesConsulta, anio: anioConsulta, resumen: resumen[0], porDia, porArea });
  } catch (err) { res.status(500).json({ mensaje: "Error del servidor", error: err.message }); }
};

exports.getIndicadores = async (req, res) => {
  try {
    const ahora = new Date();
    const mesActual = ahora.getMonth() + 1;
    const anioActual = ahora.getFullYear();
    const mesAnterior = mesActual === 1 ? 12 : mesActual - 1;
    const anioAnterior = mesActual === 1 ? anioActual - 1 : anioActual;

    const [[{ activos }]] = await pool.query(`SELECT COUNT(*) AS activos FROM empleado WHERE activo = 1`);
    const [[{ activosAnt }]] = await pool.query(
      `SELECT COUNT(*) AS activos FROM empleado WHERE activo = 1 AND YEAR(creado_en) = ? AND MONTH(creado_en) = ?`,
      [anioAnterior, mesAnterior]
    );

    const [[{ asis }]] = await pool.query(`
      SELECT ROUND(SUM(estado != 'ausente') / NULLIF(COUNT(*), 0) * 100, 1) AS asis
      FROM asistencia WHERE MONTH(fecha) = ? AND YEAR(fecha) = ?
    `, [mesActual, anioActual]);
    const [[{ asisAnt }]] = await pool.query(`
      SELECT ROUND(SUM(estado != 'ausente') / NULLIF(COUNT(*), 0) * 100, 1) AS asis
      FROM asistencia WHERE MONTH(fecha) = ? AND YEAR(fecha) = ?
    `, [mesAnterior, anioAnterior]);

    const [[{ tard }]] = await pool.query(`
      SELECT COUNT(*) AS tard FROM asistencia WHERE MONTH(fecha) = ? AND YEAR(fecha) = ? AND estado = 'tardanza'
    `, [mesActual, anioActual]);
    const [[{ tardAnt }]] = await pool.query(`
      SELECT COUNT(*) AS tard FROM asistencia WHERE MONTH(fecha) = ? AND YEAR(fecha) = ? AND estado = 'tardanza'
    `, [mesAnterior, anioAnterior]);

    const [[{ inc }]] = await pool.query(`SELECT COUNT(*) AS inc FROM incidencias WHERE estado = 'pendiente'`);
    const [[{ incAnt }]] = await pool.query(`
      SELECT COUNT(*) AS inc FROM incidencias WHERE estado = 'pendiente' AND MONTH(created_at) = ? AND YEAR(created_at) = ?
    `, [mesAnterior, anioAnterior]);

    const [[{ aus }]] = await pool.query(`
      SELECT COUNT(*) AS aus FROM asistencia WHERE MONTH(fecha) = ? AND YEAR(fecha) = ? AND estado = 'ausente'
    `, [mesActual, anioActual]);
    const [[{ ausAnt }]] = await pool.query(`
      SELECT COUNT(*) AS aus FROM asistencia WHERE MONTH(fecha) = ? AND YEAR(fecha) = ? AND estado = 'ausente'
    `, [mesAnterior, anioAnterior]);

    const [[{ reps }]] = await pool.query(`
      SELECT COUNT(*) AS reps FROM reportes_historial WHERE MONTH(fecha_generacion) = ? AND YEAR(fecha_generacion) = ?
    `, [mesActual, anioActual]);
    const [[{ repsAnt }]] = await pool.query(`
      SELECT COUNT(*) AS reps FROM reportes_historial WHERE MONTH(fecha_generacion) = ? AND YEAR(fecha_generacion) = ?
    `, [mesAnterior, anioAnterior]);

    res.json({
      empleados_activos:    { valor: activos, variacion: activos - (activosAnt || activos) },
      asistencia_mes:       { valor: asis || 0, variacion: +((asis || 0) - (asisAnt || 0)).toFixed(1) },
      tardanzas_mes:        { valor: tard || 0, variacion: tard - (tardAnt || tard) },
      incidencias_abiertas: { valor: inc || 0, variacion: inc - (incAnt || inc) },
      ausencias_mes:        { valor: aus || 0, variacion: aus - (ausAnt || aus) },
      reportes_mes:         { valor: reps || 0, variacion: reps - (repsAnt || reps) },
    });
  } catch (err) { res.status(500).json({ mensaje: "Error del servidor", error: err.message }); }
};

exports.getTendencia = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT MONTH(fecha) AS mes, YEAR(fecha) AS anio,
        ROUND(SUM(estado != 'ausente') / NULLIF(COUNT(*), 0) * 100, 1) AS porcentaje
      FROM asistencia
      WHERE fecha >= DATE_SUB(LAST_DAY(DATE_SUB(CURDATE(), INTERVAL 6 MONTH)), INTERVAL DAY(LAST_DAY(DATE_SUB(CURDATE(), INTERVAL 6 MONTH)))-1 DAY)
        AND fecha <= LAST_DAY(CURDATE())
      GROUP BY YEAR(fecha), MONTH(fecha) ORDER BY anio, mes
      LIMIT 6
    `);
    res.json({ tendencia: rows });
  } catch (err) { res.status(500).json({ mensaje: "Error del servidor", error: err.message }); }
};

exports.getReporteAsistencia = async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta, empleado_id, area_id } = req.query;
    let query = `
      SELECT a.id, e.cedula, CONCAT(e.nombre, ' ', e.apellido) AS empleado,
        ar.nombre AS area, ar.piso, a.fecha,
        TIME_FORMAT(a.fecha_hora_entrada, '%H:%i') AS entrada1,
        TIME_FORMAT(a.fecha_hora_salida_manana, '%H:%i') AS salida1,
        TIME_FORMAT(a.fecha_hora_entrada_tarde, '%H:%i') AS entrada2,
        TIME_FORMAT(a.fecha_hora_salida, '%H:%i') AS salida2,
        a.horas_trabajadas, a.horas_extra, a.minutos_tardanza, a.tipo_marcacion, a.estado, a.observacion
      FROM asistencia a JOIN empleado e ON a.empleado_id = e.id JOIN areas ar ON e.area_id = ar.id WHERE 1=1
    `;
    const params = [];
    if (fecha_desde) { query += ` AND a.fecha >= ?`; params.push(fecha_desde); }
    if (fecha_hasta) { query += ` AND a.fecha <= ?`; params.push(fecha_hasta); }
    if (empleado_id) { query += ` AND a.empleado_id = ?`; params.push(empleado_id); }
    if (area_id) { query += ` AND e.area_id = ?`; params.push(area_id); }
    query += ` ORDER BY a.fecha DESC, e.apellido`;
    const [rows] = await pool.query(query, params);
    res.json({ registros: rows, total: rows.length });
  } catch (err) { res.status(500).json({ mensaje: "Error del servidor", error: err.message }); }
};

exports.getReporteIncidencias = async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta, estado, tipo, area_id } = req.query;
    let query = `
      SELECT i.id, i.tipo, i.descripcion, i.evidencia_url, i.estado,
        DATE_FORMAT(i.created_at, '%Y-%m-%d') AS fecha,
        CONCAT(e.nombre, ' ', e.apellido) AS empleado, e.cedula, ar.nombre AS area, i.motivo_rechazo
      FROM incidencias i JOIN empleado e ON i.empleado_id = e.id JOIN areas ar ON e.area_id = ar.id WHERE 1=1
    `;
    const params = [];
    if (fecha_desde) { query += ` AND i.created_at >= ?`; params.push(fecha_desde); }
    if (fecha_hasta) { query += ` AND i.created_at <= ?`; params.push(fecha_hasta + ' 23:59:59'); }
    if (estado) { query += ` AND i.estado = ?`; params.push(estado); }
    if (tipo) { query += ` AND i.tipo = ?`; params.push(tipo); }
    if (area_id) { query += ` AND e.area_id = ?`; params.push(area_id); }
    query += ` ORDER BY i.created_at DESC`;
    const [rows] = await pool.query(query, params);
    res.json({ registros: rows, total: rows.length });
  } catch (err) { res.status(500).json({ mensaje: "Error del servidor", error: err.message }); }
};

exports.getReporteTardanzas = async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta, area_id, empleado_id } = req.query;
    let query = `
      SELECT a.id, e.cedula, CONCAT(e.nombre, ' ', e.apellido) AS empleado,
        ar.nombre AS area, ar.piso, a.fecha,
        TIME_FORMAT(a.fecha_hora_entrada, '%H:%i') AS entrada1,
        TIME_FORMAT(a.fecha_hora_entrada_tarde, '%H:%i') AS entrada2,
        a.minutos_tardanza, a.tipo_marcacion, a.observacion
      FROM asistencia a JOIN empleado e ON a.empleado_id = e.id JOIN areas ar ON e.area_id = ar.id
      WHERE a.estado = 'tardanza'
    `;
    const params = [];
    if (fecha_desde) { query += ` AND a.fecha >= ?`; params.push(fecha_desde); }
    if (fecha_hasta) { query += ` AND a.fecha <= ?`; params.push(fecha_hasta); }
    if (area_id) { query += ` AND e.area_id = ?`; params.push(area_id); }
    if (empleado_id) { query += ` AND a.empleado_id = ?`; params.push(empleado_id); }
    query += ` ORDER BY a.fecha DESC, a.minutos_tardanza DESC`;
    const [rows] = await pool.query(query, params);
    res.json({ registros: rows, total: rows.length });
  } catch (err) { res.status(500).json({ mensaje: "Error del servidor", error: err.message }); }
};

exports.getReporteAusencias = async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta, area_id, empleado_id } = req.query;
    let query = `
      SELECT a.id, e.cedula, CONCAT(e.nombre, ' ', e.apellido) AS empleado,
        ar.nombre AS area, ar.piso, a.fecha, a.estado, a.observacion, a.tipo_marcacion
      FROM asistencia a JOIN empleado e ON a.empleado_id = e.id JOIN areas ar ON e.area_id = ar.id
      WHERE a.estado IN ('ausente', 'justificado')
    `;
    const params = [];
    if (fecha_desde) { query += ` AND a.fecha >= ?`; params.push(fecha_desde); }
    if (fecha_hasta) { query += ` AND a.fecha <= ?`; params.push(fecha_hasta); }
    if (area_id) { query += ` AND e.area_id = ?`; params.push(area_id); }
    if (empleado_id) { query += ` AND a.empleado_id = ?`; params.push(empleado_id); }
    query += ` ORDER BY a.fecha DESC, e.apellido`;
    const [rows] = await pool.query(query, params);
    res.json({ registros: rows, total: rows.length });
  } catch (err) { res.status(500).json({ mensaje: "Error del servidor", error: err.message }); }
};

exports.getReporteEmpleados = async (req, res) => {
  try {
    const { area_id, cargo_id, activo } = req.query;
    let query = `
      SELECT e.id, e.cedula, e.nombre, e.apellido, e.correo, e.telefono,
        ar.nombre AS area, ca.nombre AS cargo, e.activo
      FROM empleado e LEFT JOIN areas ar ON e.area_id = ar.id LEFT JOIN cargos ca ON e.cargo_id = ca.id WHERE 1=1
    `;
    const params = [];
    if (area_id) { query += ` AND e.area_id = ?`; params.push(area_id); }
    if (cargo_id) { query += ` AND e.cargo_id = ?`; params.push(cargo_id); }
    if (activo !== undefined) { query += ` AND e.activo = ?`; params.push(activo); }
    query += ` ORDER BY e.apellido, e.nombre`;
    const [rows] = await pool.query(query, params);
    res.json({ registros: rows, total: rows.length });
  } catch (err) { res.status(500).json({ mensaje: "Error del servidor", error: err.message }); }
};

exports.getReporteMarcaciones = async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta, empleado_id, area_id } = req.query;
    let query = `
      SELECT a.id, e.cedula, CONCAT(e.nombre, ' ', e.apellido) AS empleado,
        ar.nombre AS area, a.fecha,
        TIME_FORMAT(a.fecha_hora_entrada, '%H:%i') AS entrada1,
        TIME_FORMAT(a.fecha_hora_salida_manana, '%H:%i') AS salida1,
        TIME_FORMAT(a.fecha_hora_entrada_tarde, '%H:%i') AS entrada2,
        TIME_FORMAT(a.fecha_hora_salida, '%H:%i') AS salida2,
        a.horas_trabajadas, a.horas_extra, a.minutos_tardanza, a.tipo_marcacion, a.estado
      FROM asistencia a JOIN empleado e ON a.empleado_id = e.id JOIN areas ar ON e.area_id = ar.id WHERE 1=1
    `;
    const params = [];
    if (fecha_desde) { query += ` AND a.fecha >= ?`; params.push(fecha_desde); }
    if (fecha_hasta) { query += ` AND a.fecha <= ?`; params.push(fecha_hasta); }
    if (empleado_id) { query += ` AND a.empleado_id = ?`; params.push(empleado_id); }
    if (area_id) { query += ` AND e.area_id = ?`; params.push(area_id); }
    query += ` ORDER BY a.fecha DESC, a.fecha_hora_entrada DESC`;
    const [rows] = await pool.query(query, params);
    res.json({ registros: rows, total: rows.length });
  } catch (err) { res.status(500).json({ mensaje: "Error del servidor", error: err.message }); }
};

exports.getHistorial = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, tipo_reporte, usuario_nombre, fecha_generacion, formato, total_registros
      FROM reportes_historial ORDER BY fecha_generacion DESC LIMIT 20
    `);
    res.json({ historial: rows });
  } catch (err) { res.status(500).json({ mensaje: "Error del servidor", error: err.message }); }
};

exports.guardarHistorial = async (req, res) => {
  try {
    const { tipo_reporte, formato, filtros, total_registros } = req.body;
    const usuario_nombre = req.user.nombre || req.user.username || "Desconocido";
    await pool.query(
      `INSERT INTO reportes_historial (tipo_reporte, usuario_nombre, formato, filtros, total_registros) VALUES (?, ?, ?, ?, ?)`,
      [tipo_reporte, usuario_nombre, formato, JSON.stringify(filtros || {}), total_registros || 0]
    );
    res.json({ mensaje: "Historial guardado" });
  } catch (err) { res.status(500).json({ mensaje: "Error del servidor", error: err.message }); }
};
