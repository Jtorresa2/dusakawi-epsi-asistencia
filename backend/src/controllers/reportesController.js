const pool = require('../config/db');

exports.getReporteDiario = async (req, res) => {
  try {
    const { fecha } = req.query;
    const fechaConsulta = fecha || new Date().toISOString().split("T")[0];

    const [registros] = await pool.query(`
      SELECT 
        CONCAT(e.nombre, ' ', e.apellido) AS colaborador,
        e.cedula,
        ar.nombre AS area,
        ar.piso,
        a.fecha,
        a.fecha_hora_entrada,
        a.fecha_hora_salida,
        a.horas_trabajadas,
        a.horas_extra,
        a.minutos_tardanza,
        a.tipo_marcacion,
        a.estado,
        a.observacion
      FROM asistencia a
      JOIN empleados e ON a.empleado_id = e.id
      JOIN areas ar ON e.area_id = ar.id
      WHERE a.fecha = ?
      ORDER BY ar.piso, ar.nombre, e.apellido
    `, [fechaConsulta]);

    const [resumen] = await pool.query(`
      SELECT
        COUNT(*) AS total,
        SUM(estado = 'puntual')     AS puntuales,
        SUM(estado = 'tardanza')    AS tardanzas,
        SUM(estado = 'ausente')     AS ausentes,
        SUM(estado = 'justificado') AS justificados,
        ROUND(SUM(estado != 'ausente') / COUNT(*) * 100, 1) AS porcentaje_asistencia,
        SUM(horas_extra) AS total_horas_extra,
        AVG(minutos_tardanza) AS promedio_tardanza
      FROM asistencia
      WHERE fecha = ?
    `, [fechaConsulta]);

    res.json({ fecha: fechaConsulta, resumen: resumen[0], registros });
  } catch (err) {
    res.status(500).json({ mensaje: "Error del servidor", error: err.message });
  }
};

exports.getReporteMensual = async (req, res) => {
  try {
    const { mes, anio } = req.query;
    const mesConsulta  = mes  || new Date().getMonth() + 1;
    const anioConsulta = anio || new Date().getFullYear();

    const [porDia] = await pool.query(`
      SELECT
        fecha,
        COUNT(*) AS total,
        SUM(estado = 'puntual')     AS puntuales,
        SUM(estado = 'tardanza')    AS tardanzas,
        SUM(estado = 'ausente')     AS ausentes,
        ROUND(SUM(estado != 'ausente') / COUNT(*) * 100, 1) AS porcentaje_asistencia
      FROM asistencia
      WHERE MONTH(fecha) = ? AND YEAR(fecha) = ?
      GROUP BY fecha
      ORDER BY fecha
    `, [mesConsulta, anioConsulta]);

    const [porArea] = await pool.query(`
      SELECT
        ar.nombre AS area,
        ar.piso,
        COUNT(*) AS total,
        SUM(a.estado = 'puntual')  AS puntuales,
        SUM(a.estado = 'tardanza') AS tardanzas,
        SUM(a.estado = 'ausente')  AS ausentes,
        ROUND(SUM(a.estado != 'ausente') / COUNT(*) * 100, 1) AS porcentaje_asistencia
      FROM asistencia a
      JOIN empleados e ON a.empleado_id = e.id
      JOIN areas ar ON e.area_id = ar.id
      WHERE MONTH(a.fecha) = ? AND YEAR(a.fecha) = ?
      GROUP BY ar.id
      ORDER BY ar.piso, ar.nombre
    `, [mesConsulta, anioConsulta]);

    const [resumen] = await pool.query(`
      SELECT
        COUNT(*) AS total_registros,
        SUM(estado = 'puntual')     AS puntuales,
        SUM(estado = 'tardanza')    AS tardanzas,
        SUM(estado = 'ausente')     AS ausentes,
        SUM(horas_extra)            AS total_horas_extra,
        ROUND(SUM(estado != 'ausente') / COUNT(*) * 100, 1) AS porcentaje_asistencia,
        ROUND(SUM(estado = 'puntual') / COUNT(*) * 100, 1)  AS porcentaje_puntualidad
      FROM asistencia
      WHERE MONTH(fecha) = ? AND YEAR(fecha) = ?
    `, [mesConsulta, anioConsulta]);

    res.json({ mes: mesConsulta, anio: anioConsulta, resumen: resumen[0], porDia, porArea });
  } catch (err) {
    res.status(500).json({ mensaje: "Error del servidor", error: err.message });
  }
};