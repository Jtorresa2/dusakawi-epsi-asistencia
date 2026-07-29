const pool = require('../config/db');

exports.getReporteDiario = async (req, res) => {
  try {
    const { fecha } = req.query;
    const fechaConsulta = fecha || new Date().toISOString().split("T")[0];
    const [registros] = await pool.query(`
      SELECT CONCAT(e.nombre, ' ', e.apellido) AS empleado, e.cedula,
        ar.nombre AS area, ar.piso, a.fecha,
        TO_CHAR(a.fecha_hora_entrada, 'HH24:MI') AS entrada1,
        TO_CHAR(a.fecha_hora_salida_manana, 'HH24:MI') AS salida1,
        TO_CHAR(a.fecha_hora_entrada_tarde, 'HH24:MI') AS entrada2,
        TO_CHAR(a.fecha_hora_salida, 'HH24:MI') AS salida2,
        a.horas_trabajadas, a.horas_extra, a.minutos_tardanza, a.tipo_marcacion, a.estado, a.observacion
      FROM asistencia a JOIN empleado e ON a.empleado_id = e.id JOIN areas ar ON e.area_id = ar.id
      WHERE a.fecha = ? ORDER BY ar.piso, ar.nombre, e.apellido
    `, [fechaConsulta]);
    const [resumen] = await pool.query(`
      SELECT COUNT(*) AS total, SUM((estado = 'puntual')::int) AS puntuales, SUM((estado = 'tardanza')::int) AS tardanzas,
        SUM((estado = 'ausente')::int) AS ausentes, SUM((estado = 'justificado')::int) AS justificados,
        ROUND(SUM((estado != 'ausente')::int) / COUNT(*) * 100, 1) AS porcentaje_asistencia,
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

    // Festivos del mes
    const [festivos] = await pool.query(
      `SELECT fecha, nombre FROM festivos WHERE activo = TRUE
       AND EXTRACT(MONTH FROM fecha) = ? AND EXTRACT(YEAR FROM fecha) = ?`,
      [mesConsulta, anioConsulta]
    );
    const festivosSet = new Set(festivos.map(f => {
      const d = new Date(f.fecha);
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }));
    const festivosMap = Object.fromEntries(festivos.map(f => {
      const d = new Date(f.fecha);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      return [key, f.nombre];
    }));

    const [porDia] = await pool.query(`
      SELECT fecha, COUNT(*) AS total, SUM((estado = 'puntual')::int) AS puntuales,
        SUM((estado = 'tardanza')::int) AS tardanzas, SUM((estado = 'ausente')::int) AS ausentes,
        ROUND(SUM((estado != 'ausente')::int) / COUNT(*) * 100, 1) AS porcentaje_asistencia
      FROM asistencia WHERE EXTRACT(MONTH FROM fecha) = ? AND EXTRACT(YEAR FROM fecha) = ? GROUP BY fecha ORDER BY fecha
    `, [mesConsulta, anioConsulta]);

    // Marcar festivos en porDia
    const porDiaConFestivos = porDia.map(d => {
      const fechaStr = d.fecha instanceof Date
        ? `${d.fecha.getFullYear()}-${String(d.fecha.getMonth()+1).padStart(2,'0')}-${String(d.fecha.getDate()).padStart(2,'0')}`
        : d.fecha.substring(0, 10);
      return { ...d, esFestivo: festivosSet.has(fechaStr), festivo: festivosMap[fechaStr] || null };
    });

    const [porArea] = await pool.query(`
      SELECT ar.nombre AS area, ar.piso, COUNT(*) AS total,
        SUM((a.estado = 'puntual')::int) AS puntuales, SUM((a.estado = 'tardanza')::int) AS tardanzas,
        SUM((a.estado = 'ausente')::int) AS ausentes,
        ROUND(SUM((a.estado != 'ausente')::int) / COUNT(*) * 100, 1) AS porcentaje_asistencia
      FROM asistencia a JOIN empleado e ON a.empleado_id = e.id JOIN areas ar ON e.area_id = ar.id
      WHERE EXTRACT(MONTH FROM a.fecha) = ? AND EXTRACT(YEAR FROM a.fecha) = ? GROUP BY ar.id ORDER BY ar.piso, ar.nombre
    `, [mesConsulta, anioConsulta]);

    // Resumen excluyendo festivos
    const [resumen] = await pool.query(`
      SELECT COUNT(*) AS total_registros, SUM((estado = 'puntual')::int) AS puntuales,
        SUM((estado = 'tardanza')::int) AS tardanzas, SUM((estado = 'ausente')::int) AS ausentes,
        SUM(horas_extra) AS total_horas_extra,
        ROUND(SUM((estado != 'ausente')::int) / COUNT(*) * 100, 1) AS porcentaje_asistencia,
        ROUND(SUM((estado = 'puntual')::int) / COUNT(*) * 100, 1) AS porcentaje_puntualidad
      FROM asistencia WHERE EXTRACT(MONTH FROM fecha) = ? AND EXTRACT(YEAR FROM fecha) = ?
    `, [mesConsulta, anioConsulta]);

    res.json({
      mes: mesConsulta,
      anio: anioConsulta,
      festivos: festivos.length,
      resumen: { ...resumen[0], festivos: festivos.length },
      porDia: porDiaConFestivos,
      porArea,
    });
  } catch (err) { res.status(500).json({ mensaje: "Error del servidor", error: err.message }); }
};

exports.getIndicadores = async (req, res) => {
  try {
    const ahora = new Date();
    const mesActual = ahora.getMonth() + 1;
    const anioActual = ahora.getFullYear();
    const mesAnterior = mesActual === 1 ? 12 : mesActual - 1;
    const anioAnterior = mesActual === 1 ? anioActual - 1 : anioActual;

    const [[{ activos }]] = await pool.query(`SELECT COUNT(*) AS activos FROM empleado WHERE activo = TRUE`);
    const [[{ activosAnt }]] = await pool.query(
      `SELECT COUNT(*) AS activos FROM empleado WHERE activo = TRUE AND EXTRACT(YEAR FROM creado_en) = ? AND EXTRACT(MONTH FROM creado_en) = ?`,
      [anioAnterior, mesAnterior]
    );

    const [[{ asis }]] = await pool.query(`
      SELECT ROUND(SUM((estado != 'ausente')::int) / NULLIF(COUNT(*), 0) * 100, 1) AS asis
      FROM asistencia WHERE EXTRACT(MONTH FROM fecha) = ? AND EXTRACT(YEAR FROM fecha) = ?
    `, [mesActual, anioActual]);
    const [[{ asisAnt }]] = await pool.query(`
      SELECT ROUND(SUM((estado != 'ausente')::int) / NULLIF(COUNT(*), 0) * 100, 1) AS asis
      FROM asistencia WHERE EXTRACT(MONTH FROM fecha) = ? AND EXTRACT(YEAR FROM fecha) = ?
    `, [mesAnterior, anioAnterior]);

    const [[{ tard }]] = await pool.query(`
      SELECT COUNT(*) AS tard FROM asistencia WHERE EXTRACT(MONTH FROM fecha) = ? AND EXTRACT(YEAR FROM fecha) = ? AND estado = 'tardanza'
    `, [mesActual, anioActual]);
    const [[{ tardAnt }]] = await pool.query(`
      SELECT COUNT(*) AS tard FROM asistencia WHERE EXTRACT(MONTH FROM fecha) = ? AND EXTRACT(YEAR FROM fecha) = ? AND estado = 'tardanza'
    `, [mesAnterior, anioAnterior]);

    const [[{ inc }]] = await pool.query(`SELECT COUNT(*) AS inc FROM incidencias WHERE estado = 'pendiente'`);
    const [[{ incAnt }]] = await pool.query(`
      SELECT COUNT(*) AS inc FROM incidencias WHERE estado = 'pendiente' AND EXTRACT(MONTH FROM created_at) = ? AND EXTRACT(YEAR FROM created_at) = ?
    `, [mesAnterior, anioAnterior]);

    const [[{ aus }]] = await pool.query(`
      SELECT COUNT(*) AS aus FROM asistencia WHERE EXTRACT(MONTH FROM fecha) = ? AND EXTRACT(YEAR FROM fecha) = ? AND estado = 'ausente'
    `, [mesActual, anioActual]);
    const [[{ ausAnt }]] = await pool.query(`
      SELECT COUNT(*) AS aus FROM asistencia WHERE EXTRACT(MONTH FROM fecha) = ? AND EXTRACT(YEAR FROM fecha) = ? AND estado = 'ausente'
    `, [mesAnterior, anioAnterior]);

    const [[{ reps }]] = await pool.query(`
      SELECT COUNT(*) AS reps FROM reportes_historial WHERE EXTRACT(MONTH FROM fecha_generacion) = ? AND EXTRACT(YEAR FROM fecha_generacion) = ?
    `, [mesActual, anioActual]);
    const [[{ repsAnt }]] = await pool.query(`
      SELECT COUNT(*) AS reps FROM reportes_historial WHERE EXTRACT(MONTH FROM fecha_generacion) = ? AND EXTRACT(YEAR FROM fecha_generacion) = ?
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
      SELECT EXTRACT(MONTH FROM fecha) AS mes, EXTRACT(YEAR FROM fecha) AS anio,
        ROUND(SUM((estado != 'ausente')::int) / NULLIF(COUNT(*), 0) * 100, 1) AS porcentaje
      FROM asistencia
      WHERE fecha >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '6 months')::date
        AND fecha <= (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date
      GROUP BY EXTRACT(YEAR FROM fecha), EXTRACT(MONTH FROM fecha) ORDER BY anio, mes
      LIMIT 6
    `);
    res.json({ tendencia: rows });
  } catch (err) { res.status(500).json({ mensaje: "Error del servidor", error: err.message }); }
};

exports.getReporteAsistencia = async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta, empleado_id, area_id, estado } = req.query;
    let query = `
      SELECT a.id, e.cedula, CONCAT(e.nombre, ' ', e.apellido) AS empleado,
        ar.nombre AS area, ar.piso, a.fecha,
        TO_CHAR(a.fecha_hora_entrada, 'HH24:MI') AS entrada1,
        TO_CHAR(a.fecha_hora_salida_manana, 'HH24:MI') AS salida1,
        TO_CHAR(a.fecha_hora_entrada_tarde, 'HH24:MI') AS entrada2,
        TO_CHAR(a.fecha_hora_salida, 'HH24:MI') AS salida2,
        a.horas_trabajadas, a.horas_extra, a.minutos_tardanza, a.tipo_marcacion, a.estado, a.observacion
      FROM asistencia a JOIN empleado e ON a.empleado_id = e.id JOIN areas ar ON e.area_id = ar.id WHERE 1=1
    `;
    const params = [];
    if (fecha_desde) { query += ` AND a.fecha >= ?`; params.push(fecha_desde); }
    if (fecha_hasta) { query += ` AND a.fecha <= ?`; params.push(fecha_hasta); }
    if (empleado_id) { query += ` AND a.empleado_id = ?`; params.push(empleado_id); }
    if (area_id) { query += ` AND e.area_id = ?`; params.push(area_id); }
    if (estado) { query += ` AND a.estado = ?`; params.push(estado); }
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
        TO_CHAR(i.created_at, 'YYYY-MM-DD') AS fecha,
        CONCAT(e.nombre, ' ', e.apellido) AS empleado, e.cedula, ar.nombre AS area, i.motivo_rechazo
      FROM incidencias i JOIN empleado e ON i.empleado_id = e.id JOIN areas ar ON e.area_id = ar.id WHERE 1=1
    `;
    const params = [];
    if (fecha_desde) { query += ` AND i.created_at >= ?`; params.push(fecha_desde); }
    if (fecha_hasta) { query += ` AND i.created_at <= ?`; params.push(fecha_hasta + ' 23:59:59'); }
    if (estado) { query += ` AND i.estado = ?`; params.push(estado); }
    if (tipo) { query += ` AND i.tipo = ?`; params.push(tipo); }
    if (area_id) { query += ` AND e.area_id = ?`; params.push(area_id); }
    query += ` ORDER BY i.id ASC`;
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
        TO_CHAR(a.fecha_hora_entrada, 'HH24:MI') AS entrada1,
        TO_CHAR(a.fecha_hora_entrada_tarde, 'HH24:MI') AS entrada2,
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
        AND NOT EXISTS (
          SELECT 1 FROM permisos p
          WHERE p.empleado_id = a.empleado_id AND a.fecha BETWEEN p.fecha_desde AND p.fecha_hasta
        )
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

exports.getReportePorEmpleado = async (req, res) => {
  try {
    const { empleado_id, mes, anio } = req.query;
    if (!empleado_id) return res.status(400).json({ mensaje: "empleado_id es requerido" });

    const mesConsulta  = mes  || new Date().getMonth() + 1;
    const anioConsulta = anio || new Date().getFullYear();

    // Datos del empleado
    const [[empleado]] = await pool.query(`
      SELECT e.id, e.cedula, e.nombre, e.apellido, ar.nombre AS area, ca.nombre AS cargo,
        TO_CHAR(e.fecha_ingreso, 'YYYY-MM-DD') AS fecha_ingreso
      FROM empleado e LEFT JOIN areas ar ON e.area_id = ar.id LEFT JOIN cargos ca ON e.cargo_id = ca.id
      WHERE e.id = ?
    `, [empleado_id]);

    if (!empleado) return res.status(404).json({ mensaje: "Empleado no encontrado" });

    // Días hábiles del mes
    const diasDelMes = new Date(anioConsulta, mesConsulta, 0).getDate();
    let diasHabiles = 0;
    for (let d = 1; d <= diasDelMes; d++) {
      const dia = new Date(anioConsulta, mesConsulta - 1, d);
      if (dia.getDay() !== 0 && dia.getDay() !== 6) diasHabiles++;
    }

    // Festivos del mes
    const [festivos] = await pool.query(
      `SELECT COUNT(*) AS total FROM festivos
       WHERE activo = TRUE AND EXTRACT(MONTH FROM fecha) = ? AND EXTRACT(YEAR FROM fecha) = ?
       AND EXTRACT(DOW FROM fecha) != 0 AND EXTRACT(DOW FROM fecha) != 6`,
      [mesConsulta, anioConsulta]
    );
    const totalFestivos = Number(festivos[0]?.total || 0);
    const diasEsperados = diasHabiles - totalFestivos;

    // Resumen de asistencia
    const [[asis]] = await pool.query(`
      SELECT
        COUNT(*) AS total_registros,
        SUM((estado = 'puntual')::int) AS puntuales,
        SUM((estado = 'tardanza')::int) AS tardanzas,
        SUM((estado = 'ausente')::int) AS ausentes,
        SUM((estado = 'justificado')::int) AS justificados,
        COALESCE(SUM(horas_trabajadas), 0) AS horas_trabajadas,
        COALESCE(SUM(horas_extra), 0) AS horas_extra,
        COALESCE(SUM(minutos_tardanza), 0) AS total_minutos_tardanza
      FROM asistencia
      WHERE empleado_id = ? AND EXTRACT(MONTH FROM fecha) = ? AND EXTRACT(YEAR FROM fecha) = ?
    `, [empleado_id, mesConsulta, anioConsulta]);

    const resumen = asis || { total_registros: 0, puntuales: 0, tardanzas: 0, ausentes: 0, justificados: 0, horas_trabajadas: 0, horas_extra: 0, total_minutos_tardanza: 0 };

    // Permisos del mes
    const [permisos] = await pool.query(`
      SELECT COUNT(*) AS total,
        COALESCE(SUM(CASE WHEN tipo IN ('completo', 'comision') THEN
          (fecha_hasta - fecha_desde + 1) - (
            SELECT COUNT(*) FROM generate_series(fecha_desde::date, fecha_hasta::date, '1 day') AS d
            WHERE EXTRACT(DOW FROM d) IN (0, 6)
          )
        ELSE 1 END), 0) AS dias_permiso
      FROM permisos
      WHERE empleado_id = ? AND EXTRACT(MONTH FROM fecha_desde) = ? AND EXTRACT(YEAR FROM fecha_desde) = ?
    `, [empleado_id, mesConsulta, anioConsulta]);

    // Incidencias del mes
    const [[incidencias]] = await pool.query(`
      SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE estado = 'pendiente') AS pendientes
      FROM incidencias
      WHERE empleado_id = ? AND EXTRACT(MONTH FROM fecha) = ? AND EXTRACT(YEAR FROM fecha) = ?
    `, [empleado_id, mesConsulta, anioConsulta]);

    // Detalle por día
    const [detalle] = await pool.query(`
      SELECT a.fecha, a.estado,
        TO_CHAR(a.fecha_hora_entrada, 'HH24:MI') AS entrada1,
        TO_CHAR(a.fecha_hora_salida_manana, 'HH24:MI') AS salida1,
        TO_CHAR(a.fecha_hora_entrada_tarde, 'HH24:MI') AS entrada2,
        TO_CHAR(a.fecha_hora_salida, 'HH24:MI') AS salida2,
        a.horas_trabajadas, a.horas_extra, a.minutos_tardanza, a.observacion
      FROM asistencia a
      WHERE a.empleado_id = ? AND EXTRACT(MONTH FROM a.fecha) = ? AND EXTRACT(YEAR FROM a.fecha) = ?
      ORDER BY a.fecha DESC
    `, [empleado_id, mesConsulta, anioConsulta]);

    // Marcar festivos en el detalle
    const [festivosDetalle] = await pool.query(
      `SELECT fecha, nombre FROM festivos WHERE activo = TRUE
       AND EXTRACT(MONTH FROM fecha) = ? AND EXTRACT(YEAR FROM fecha) = ?`,
      [mesConsulta, anioConsulta]
    );
    const festivosMap = Object.fromEntries(festivosDetalle.map(f => {
      const d = new Date(f.fecha);
      return [`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`, f.nombre];
    }));

    const detalleConFestivos = detalle.map(d => {
      const fechaStr = d.fecha instanceof Date
        ? `${d.fecha.getFullYear()}-${String(d.fecha.getMonth()+1).padStart(2,'0')}-${String(d.fecha.getDate()).padStart(2,'0')}`
        : d.fecha.substring(0, 10);
      return { ...d, esFestivo: !!festivosMap[fechaStr], festivo: festivosMap[fechaStr] || null };
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
        horas_extra: Number(resumen.horas_extra),
        total_minutos_tardanza: Number(resumen.total_minutos_tardanza),
        porcentaje_asistencia: Math.round((Number(resumen.puntuales) + Number(resumen.tardanzas) + Number(resumen.justificados)) / Math.max(diasEsperados, 1) * 100),
        porcentaje_puntualidad: porcentajeAsistencia,
      },
      permisos: { total: Number(permisos[0]?.total || 0), dias: Number(permisos[0]?.dias_permiso || 0) },
      incidencias: { total: Number(incidencias?.total || 0), pendientes: Number(incidencias?.pendientes || 0) },
      detalle: detalleConFestivos,
    });
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
        TO_CHAR(a.fecha_hora_entrada, 'HH24:MI') AS entrada1,
        TO_CHAR(a.fecha_hora_salida_manana, 'HH24:MI') AS salida1,
        TO_CHAR(a.fecha_hora_entrada_tarde, 'HH24:MI') AS entrada2,
        TO_CHAR(a.fecha_hora_salida, 'HH24:MI') AS salida2,
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
      SELECT id, tipo_reporte, usuario_nombre, fecha_generacion, formato, filtros, total_registros
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
