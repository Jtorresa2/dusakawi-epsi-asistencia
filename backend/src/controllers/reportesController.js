const pool = require('../config/db');

exports.getReporteDiario = async (req, res) => {
  try {
    const { fecha } = req.query;
    const fechaConsulta = fecha || new Date().toISOString().split("T")[0];
    const { rows: registros } = await pool.query(`
      SELECT CONCAT(u.nombre, ' ', u.apellido) AS empleado, u.cedula,
        ar.nombre AS area, ar.piso, a.fecha,
        TO_CHAR(a.fecha_hora_entrada, 'HH24:MI') AS entrada1,
        TO_CHAR(a.fecha_hora_salida_manana, 'HH24:MI') AS salida1,
        TO_CHAR(a.fecha_hora_entrada_tarde, 'HH24:MI') AS entrada2,
        TO_CHAR(a.fecha_hora_salida, 'HH24:MI') AS salida2,
        a.horas_trabajadas, a.minutos_tardanza, a.tipo_marcacion, a.estado, a.observacion
      FROM asistencia a JOIN usuarios u ON a.usuario_id = u.id JOIN areas ar ON u.area_id = ar.id
      WHERE a.fecha = $1 ORDER BY ar.piso, ar.nombre, u.apellido
    `, [fechaConsulta]);
    const { rows: resumen } = await pool.query(`
      SELECT COUNT(*) AS total, SUM((estado = 'puntual')::int) AS puntuales, SUM((estado = 'tardanza')::int) AS tardanzas,
        SUM((estado = 'ausente')::int) AS ausentes, SUM((estado = 'justificado')::int) AS justificados,
        ROUND(SUM((estado != 'ausente')::int) / COUNT(*) * 100, 1) AS porcentaje_asistencia,
        AVG(minutos_tardanza) AS promedio_tardanza
      FROM asistencia WHERE fecha = $1
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
    const { rows: festivos } = await pool.query(
      `SELECT fecha, nombre FROM festivos WHERE activo = TRUE
       AND EXTRACT(MONTH FROM fecha) = $1 AND EXTRACT(YEAR FROM fecha) = $2`,
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

    const { rows: porDia } = await pool.query(`
      SELECT fecha, COUNT(*) AS total, SUM((estado = 'puntual')::int) AS puntuales,
        SUM((estado = 'tardanza')::int) AS tardanzas, SUM((estado = 'ausente')::int) AS ausentes,
        ROUND(SUM((estado != 'ausente')::int) / COUNT(*) * 100, 1) AS porcentaje_asistencia
      FROM asistencia WHERE EXTRACT(MONTH FROM fecha) = $1 AND EXTRACT(YEAR FROM fecha) = $2 GROUP BY fecha ORDER BY fecha
    `, [mesConsulta, anioConsulta]);

    // Marcar festivos en porDia
    const porDiaConFestivos = porDia.map(d => {
      const fechaStr = d.fecha instanceof Date
        ? `${d.fecha.getFullYear()}-${String(d.fecha.getMonth()+1).padStart(2,'0')}-${String(d.fecha.getDate()).padStart(2,'0')}`
        : d.fecha.substring(0, 10);
      return { ...d, esFestivo: festivosSet.has(fechaStr), festivo: festivosMap[fechaStr] || null };
    });

    const { rows: porArea } = await pool.query(`
      SELECT ar.nombre AS area, ar.piso, COUNT(*) AS total,
        SUM((a.estado = 'puntual')::int) AS puntuales, SUM((a.estado = 'tardanza')::int) AS tardanzas,
        SUM((a.estado = 'ausente')::int) AS ausentes,
        ROUND(SUM((a.estado != 'ausente')::int) / COUNT(*) * 100, 1) AS porcentaje_asistencia
      FROM asistencia a JOIN usuarios u ON a.usuario_id = u.id JOIN areas ar ON u.area_id = ar.id
      WHERE EXTRACT(MONTH FROM a.fecha) = $1 AND EXTRACT(YEAR FROM a.fecha) = $2 GROUP BY ar.id ORDER BY ar.piso, ar.nombre
    `, [mesConsulta, anioConsulta]);

    // Resumen excluyendo festivos
    const { rows: resumen } = await pool.query(`
      SELECT COUNT(*) AS total_registros, SUM((estado = 'puntual')::int) AS puntuales,
        SUM((estado = 'tardanza')::int) AS tardanzas, SUM((estado = 'ausente')::int) AS ausentes,
        ROUND(SUM((estado != 'ausente')::int) / COUNT(*) * 100, 1) AS porcentaje_asistencia,
        ROUND(SUM((estado = 'puntual')::int) / COUNT(*) * 100, 1) AS porcentaje_puntualidad
      FROM asistencia WHERE EXTRACT(MONTH FROM fecha) = $1 AND EXTRACT(YEAR FROM fecha) = $2
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

    const { rows: [{ activos }] } = await pool.query(`SELECT COUNT(*) AS activos FROM usuarios WHERE activo = TRUE`);
    const { rows: [{ activosAnt }] } = await pool.query(
      `SELECT COUNT(*) AS activos FROM usuarios WHERE activo = TRUE AND EXTRACT(YEAR FROM creado_en) = $1 AND EXTRACT(MONTH FROM creado_en) = $2`,
      [anioAnterior, mesAnterior]
    );

    const { rows: [{ asis }] } = await pool.query(`
      SELECT ROUND(SUM((estado != 'ausente')::int) / NULLIF(COUNT(*), 0) * 100, 1) AS asis
      FROM asistencia WHERE EXTRACT(MONTH FROM fecha) = $1 AND EXTRACT(YEAR FROM fecha) = $2
    `, [mesActual, anioActual]);
    const { rows: [{ asisAnt }] } = await pool.query(`
      SELECT ROUND(SUM((estado != 'ausente')::int) / NULLIF(COUNT(*), 0) * 100, 1) AS asis
      FROM asistencia WHERE EXTRACT(MONTH FROM fecha) = $1 AND EXTRACT(YEAR FROM fecha) = $2
    `, [mesAnterior, anioAnterior]);

    const { rows: [{ tard }] } = await pool.query(`
      SELECT COUNT(*) AS tard FROM asistencia WHERE EXTRACT(MONTH FROM fecha) = $1 AND EXTRACT(YEAR FROM fecha) = $2 AND estado = 'tardanza'
    `, [mesActual, anioActual]);
    const { rows: [{ tardAnt }] } = await pool.query(`
      SELECT COUNT(*) AS tard FROM asistencia WHERE EXTRACT(MONTH FROM fecha) = $1 AND EXTRACT(YEAR FROM fecha) = $2 AND estado = 'tardanza'
    `, [mesAnterior, anioAnterior]);

    const { rows: [{ inc }] } = await pool.query(`SELECT COUNT(*) AS inc FROM incidencias WHERE estado = 'pendiente'`);
    const { rows: [{ incAnt }] } = await pool.query(`
      SELECT COUNT(*) AS inc FROM incidencias WHERE estado = 'pendiente' AND EXTRACT(MONTH FROM created_at) = $1 AND EXTRACT(YEAR FROM created_at) = $2
    `, [mesAnterior, anioAnterior]);

    const { rows: [{ aus }] } = await pool.query(`
      SELECT COUNT(*) AS aus FROM asistencia WHERE EXTRACT(MONTH FROM fecha) = $1 AND EXTRACT(YEAR FROM fecha) = $2 AND estado = 'ausente'
    `, [mesActual, anioActual]);
    const { rows: [{ ausAnt }] } = await pool.query(`
      SELECT COUNT(*) AS aus FROM asistencia WHERE EXTRACT(MONTH FROM fecha) = $1 AND EXTRACT(YEAR FROM fecha) = $2 AND estado = 'ausente'
    `, [mesAnterior, anioAnterior]);

    const { rows: [{ reps }] } = await pool.query(`
      SELECT COUNT(*) AS reps FROM reportes_historial WHERE EXTRACT(MONTH FROM fecha_generacion) = $1 AND EXTRACT(YEAR FROM fecha_generacion) = $2
    `, [mesActual, anioActual]);
    const { rows: [{ repsAnt }] } = await pool.query(`
      SELECT COUNT(*) AS reps FROM reportes_historial WHERE EXTRACT(MONTH FROM fecha_generacion) = $1 AND EXTRACT(YEAR FROM fecha_generacion) = $2
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
    const { rows } = await pool.query(`
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
    const { fecha_desde, fecha_hasta, empleado_id, usuario_id, area_id, estado } = req.query;
    const targetId = usuario_id || empleado_id; // backward compat
    let query = `
      SELECT a.id, u.cedula, CONCAT(u.nombre, ' ', u.apellido) AS empleado,
        ar.nombre AS area, ar.piso, a.fecha,
        TO_CHAR(a.fecha_hora_entrada, 'HH24:MI') AS entrada1,
        TO_CHAR(a.fecha_hora_salida_manana, 'HH24:MI') AS salida1,
        TO_CHAR(a.fecha_hora_entrada_tarde, 'HH24:MI') AS entrada2,
        TO_CHAR(a.fecha_hora_salida, 'HH24:MI') AS salida2,
        a.horas_trabajadas, a.minutos_tardanza, a.tipo_marcacion, a.estado, a.observacion
      FROM asistencia a JOIN usuarios u ON a.usuario_id = u.id JOIN areas ar ON u.area_id = ar.id WHERE 1=1
    `;
    const params = [];
    if (fecha_desde) { query += ` AND a.fecha >= $${params.length + 1}`; params.push(fecha_desde); }
    if (fecha_hasta) { query += ` AND a.fecha <= $${params.length + 1}`; params.push(fecha_hasta); }
    if (targetId) { query += ` AND a.usuario_id = $${params.length + 1}`; params.push(targetId); }
    if (area_id) { query += ` AND u.area_id = $${params.length + 1}`; params.push(area_id); }
    if (estado) { query += ` AND a.estado = $${params.length + 1}`; params.push(estado); }
    query += ` ORDER BY a.fecha DESC, u.apellido`;
    const { rows } = await pool.query(query, params);
    res.json({ registros: rows, total: rows.length });
  } catch (err) { res.status(500).json({ mensaje: "Error del servidor", error: err.message }); }
};

exports.getReporteIncidencias = async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta, estado, tipo, area_id, empleado_id, usuario_id } = req.query;
    const targetId = usuario_id || empleado_id; // backward compat
    let query = `
      SELECT i.id, i.tipo, i.descripcion, i.evidencia_url, i.estado,
        TO_CHAR(i.created_at, 'YYYY-MM-DD') AS fecha,
        CONCAT(u.nombre, ' ', u.apellido) AS empleado, u.cedula, ar.nombre AS area, i.motivo_rechazo
      FROM incidencias i JOIN usuarios u ON i.usuario_id = u.id JOIN areas ar ON u.area_id = ar.id WHERE 1=1
    `;
    const params = [];
    if (fecha_desde) { query += ` AND i.created_at >= $${params.length + 1}`; params.push(fecha_desde); }
    if (fecha_hasta) { query += ` AND i.created_at <= $${params.length + 1}`; params.push(fecha_hasta + ' 23:59:59'); }
    if (estado) { query += ` AND i.estado = $${params.length + 1}`; params.push(estado); }
    if (tipo) { query += ` AND i.tipo = $${params.length + 1}`; params.push(tipo); }
    if (area_id) { query += ` AND u.area_id = $${params.length + 1}`; params.push(area_id); }
    if (targetId) { query += ` AND i.usuario_id = $${params.length + 1}`; params.push(targetId); }
    query += ` ORDER BY i.id ASC`;
    const { rows } = await pool.query(query, params);
    res.json({ registros: rows, total: rows.length });
  } catch (err) { res.status(500).json({ mensaje: "Error del servidor", error: err.message }); }
};

exports.getReporteTardanzas = async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta, area_id, empleado_id, usuario_id } = req.query;
    const targetId = usuario_id || empleado_id; // backward compat
    let query = `
      SELECT a.id, u.cedula, CONCAT(u.nombre, ' ', u.apellido) AS empleado,
        ar.nombre AS area, ar.piso, a.fecha,
        TO_CHAR(a.fecha_hora_entrada, 'HH24:MI') AS entrada1,
        TO_CHAR(a.fecha_hora_entrada_tarde, 'HH24:MI') AS entrada2,
        a.minutos_tardanza, a.tipo_marcacion, a.observacion
      FROM asistencia a JOIN usuarios u ON a.usuario_id = u.id JOIN areas ar ON u.area_id = ar.id
      WHERE a.estado = 'tardanza'
    `;
    const params = [];
    if (fecha_desde) { query += ` AND a.fecha >= $${params.length + 1}`; params.push(fecha_desde); }
    if (fecha_hasta) { query += ` AND a.fecha <= $${params.length + 1}`; params.push(fecha_hasta); }
    if (area_id) { query += ` AND u.area_id = $${params.length + 1}`; params.push(area_id); }
    if (targetId) { query += ` AND a.usuario_id = $${params.length + 1}`; params.push(targetId); }
    query += ` ORDER BY a.fecha DESC, a.minutos_tardanza DESC`;
    const { rows } = await pool.query(query, params);
    res.json({ registros: rows, total: rows.length });
  } catch (err) { res.status(500).json({ mensaje: "Error del servidor", error: err.message }); }
};

exports.getReporteAusencias = async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta, area_id, empleado_id, usuario_id } = req.query;
    const targetId = usuario_id || empleado_id; // backward compat
    let query = `
      SELECT a.id, u.cedula, CONCAT(u.nombre, ' ', u.apellido) AS empleado,
        ar.nombre AS area, ar.piso, a.fecha, a.estado, a.observacion, a.tipo_marcacion
      FROM asistencia a JOIN usuarios u ON a.usuario_id = u.id JOIN areas ar ON u.area_id = ar.id
      WHERE a.estado IN ('ausente', 'justificado')
        AND NOT EXISTS (
          SELECT 1 FROM novedades p
          WHERE p.usuario_id = a.usuario_id AND a.fecha BETWEEN p.fecha_desde AND p.fecha_hasta
        )
    `;
    const params = [];
    if (fecha_desde) { query += ` AND a.fecha >= $${params.length + 1}`; params.push(fecha_desde); }
    if (fecha_hasta) { query += ` AND a.fecha <= $${params.length + 1}`; params.push(fecha_hasta); }
    if (area_id) { query += ` AND u.area_id = $${params.length + 1}`; params.push(area_id); }
    if (targetId) { query += ` AND a.usuario_id = $${params.length + 1}`; params.push(targetId); }
    query += ` ORDER BY a.fecha DESC, u.apellido`;
    const { rows } = await pool.query(query, params);
    res.json({ registros: rows, total: rows.length });
  } catch (err) { res.status(500).json({ mensaje: "Error del servidor", error: err.message }); }
};

exports.getReportePorEmpleado = async (req, res) => {
  try {
    const { empleado_id, usuario_id, mes, anio } = req.query;
    const targetId = usuario_id || empleado_id; // backward compat
    if (!targetId) return res.status(400).json({ mensaje: "usuario_id es requerido" });

    const mesConsulta  = mes  || new Date().getMonth() + 1;
    const anioConsulta = anio || new Date().getFullYear();

    // Datos del empleado
    const { rows: [empleado] } = await pool.query(`
      SELECT u.id, u.cedula, u.nombre, u.apellido, ar.nombre AS area, ca.nombre AS cargo,
        TO_CHAR(u.fecha_ingreso, 'YYYY-MM-DD') AS fecha_ingreso
      FROM usuarios u LEFT JOIN areas ar ON u.area_id = ar.id LEFT JOIN cargos ca ON u.cargo_id = ca.id
      WHERE u.id = $1
    `, [targetId]);

    if (!empleado) return res.status(404).json({ mensaje: "Empleado no encontrado" });

    // D├¡as h├íbiles del mes
    const diasDelMes = new Date(anioConsulta, mesConsulta, 0).getDate();
    let diasHabiles = 0;
    for (let d = 1; d <= diasDelMes; d++) {
      const dia = new Date(anioConsulta, mesConsulta - 1, d);
      if (dia.getDay() !== 0 && dia.getDay() !== 6) diasHabiles++;
    }

    // Festivos del mes
    const { rows: festivos } = await pool.query(
      `SELECT COUNT(*) AS total FROM festivos
       WHERE activo = TRUE AND EXTRACT(MONTH FROM fecha) = $1 AND EXTRACT(YEAR FROM fecha) = $2
       AND EXTRACT(DOW FROM fecha) != 0 AND EXTRACT(DOW FROM fecha) != 6`,
      [mesConsulta, anioConsulta]
    );
    const totalFestivos = Number(festivos[0]?.total || 0);
    const diasEsperados = diasHabiles - totalFestivos;

    // Resumen de asistencia
    const { rows: [asis] } = await pool.query(`
      SELECT
        COUNT(*) AS total_registros,
        SUM((estado = 'puntual')::int) AS puntuales,
        SUM((estado = 'tardanza')::int) AS tardanzas,
        SUM((estado = 'ausente')::int) AS ausentes,
        SUM((estado = 'justificado')::int) AS justificados,
        COALESCE(SUM(horas_trabajadas), 0) AS horas_trabajadas,
        COALESCE(SUM(minutos_tardanza), 0) AS total_minutos_tardanza
      FROM asistencia
      WHERE usuario_id = $1 AND EXTRACT(MONTH FROM fecha) = $2 AND EXTRACT(YEAR FROM fecha) = $3
    `, [targetId, mesConsulta, anioConsulta]);

    const resumen = asis || { total_registros: 0, puntuales: 0, tardanzas: 0, ausentes: 0, justificados: 0, horas_trabajadas: 0, total_minutos_tardanza: 0 };

    // Permisos del mes
    const { rows: permisos } = await pool.query(`
      SELECT COUNT(*) AS total,
        COALESCE(SUM(CASE WHEN tipo IN ('completo', 'comision') THEN
          (fecha_hasta - fecha_desde + 1) - (
            SELECT COUNT(*) FROM generate_series(fecha_desde::date, fecha_hasta::date, '1 day') AS d
            WHERE EXTRACT(DOW FROM d) IN (0, 6)
          )
        ELSE 1 END), 0) AS dias_permiso
      FROM novedades
      WHERE usuario_id = $1 AND EXTRACT(MONTH FROM fecha_desde) = $2 AND EXTRACT(YEAR FROM fecha_desde) = $3
    `, [targetId, mesConsulta, anioConsulta]);

    // Incidencias del mes
    const { rows: [incidencias] } = await pool.query(`
      SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE estado = 'pendiente') AS pendientes
      FROM incidencias
      WHERE usuario_id = $1 AND EXTRACT(MONTH FROM fecha) = $2 AND EXTRACT(YEAR FROM fecha) = $3
    `, [targetId, mesConsulta, anioConsulta]);

    // Detalle por d├¡a
    const { rows: detalle } = await pool.query(`
      SELECT a.fecha, a.estado,
        TO_CHAR(a.fecha_hora_entrada, 'HH24:MI') AS entrada1,
        TO_CHAR(a.fecha_hora_salida_manana, 'HH24:MI') AS salida1,
        TO_CHAR(a.fecha_hora_entrada_tarde, 'HH24:MI') AS entrada2,
        TO_CHAR(a.fecha_hora_salida, 'HH24:MI') AS salida2,
        a.horas_trabajadas, a.minutos_tardanza, a.observacion
      FROM asistencia a
      WHERE a.usuario_id = $1 AND EXTRACT(MONTH FROM a.fecha) = $2 AND EXTRACT(YEAR FROM a.fecha) = $3
      ORDER BY a.fecha DESC
    `, [targetId, mesConsulta, anioConsulta]);

    // Marcar festivos en el detalle
    const { rows: festivosDetalle } = await pool.query(
      `SELECT fecha, nombre FROM festivos WHERE activo = TRUE
       AND EXTRACT(MONTH FROM fecha) = $1 AND EXTRACT(YEAR FROM fecha) = $2`,
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
      SELECT u.id, u.cedula, u.nombre, u.apellido, u.correo, u.telefono,
        ar.nombre AS area, ca.nombre AS cargo, u.activo
      FROM usuarios u LEFT JOIN areas ar ON u.area_id = ar.id LEFT JOIN cargos ca ON u.cargo_id = ca.id WHERE 1=1
    `;
    const params = [];
    if (area_id) { query += ` AND u.area_id = $${params.length + 1}`; params.push(area_id); }
    if (cargo_id) { query += ` AND u.cargo_id = $${params.length + 1}`; params.push(cargo_id); }
    if (activo !== undefined) { query += ` AND u.activo = $${params.length + 1}`; params.push(activo); }
    query += ` ORDER BY u.apellido, u.nombre`;
    const { rows } = await pool.query(query, params);
    res.json({ registros: rows, total: rows.length });
  } catch (err) { res.status(500).json({ mensaje: "Error del servidor", error: err.message }); }
};

exports.getReporteMarcaciones = async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta, empleado_id, usuario_id, area_id } = req.query;
    const targetId = usuario_id || empleado_id; // backward compat
    let query = `
      SELECT a.id, u.cedula, CONCAT(u.nombre, ' ', u.apellido) AS empleado,
        ar.nombre AS area, a.fecha,
        TO_CHAR(a.fecha_hora_entrada, 'HH24:MI') AS entrada1,
        TO_CHAR(a.fecha_hora_salida_manana, 'HH24:MI') AS salida1,
        TO_CHAR(a.fecha_hora_entrada_tarde, 'HH24:MI') AS entrada2,
        TO_CHAR(a.fecha_hora_salida, 'HH24:MI') AS salida2,
        a.horas_trabajadas, a.minutos_tardanza, a.tipo_marcacion, a.estado
      FROM asistencia a JOIN usuarios u ON a.usuario_id = u.id JOIN areas ar ON u.area_id = ar.id WHERE 1=1
    `;
    const params = [];
    if (fecha_desde) { query += ` AND a.fecha >= $${params.length + 1}`; params.push(fecha_desde); }
    if (fecha_hasta) { query += ` AND a.fecha <= $${params.length + 1}`; params.push(fecha_hasta); }
    if (targetId) { query += ` AND a.usuario_id = $${params.length + 1}`; params.push(targetId); }
    if (area_id) { query += ` AND u.area_id = $${params.length + 1}`; params.push(area_id); }
    query += ` ORDER BY a.fecha DESC, a.fecha_hora_entrada DESC`;
    const { rows } = await pool.query(query, params);
    res.json({ registros: rows, total: rows.length });
  } catch (err) { res.status(500).json({ mensaje: "Error del servidor", error: err.message }); }
};

exports.getHistorial = async (req, res) => {
  try {
    const { rows } = await pool.query(`
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
      `INSERT INTO reportes_historial (tipo_reporte, usuario_nombre, formato, filtros, total_registros) VALUES ($1, $2, $3, $4, $5)`,
      [tipo_reporte, usuario_nombre, formato, JSON.stringify(filtros || {}), total_registros || 0]
    );
    res.json({ mensaje: "Historial guardado" });
  } catch (err) { res.status(500).json({ mensaje: "Error del servidor", error: err.message }); }
};
