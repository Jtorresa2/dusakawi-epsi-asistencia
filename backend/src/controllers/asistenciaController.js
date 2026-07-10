const pool = require('../config/db');

exports.getRegistros = async (req, res) => {
  try {
    const { fecha, area, piso, estado } = req.query;
    
    let query = `
      SELECT 
        a.id,
        e.cedula,
        CONCAT(e.nombre, ' ', e.apellido) AS colaborador,
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
      JOIN empleado e ON a.empleado_id = e.id
      JOIN areas ar ON e.area_id = ar.id
      WHERE 1=1
    `;

    const params = [];

    if (fecha) { query += ` AND a.fecha = ?`; params.push(fecha); }
    else { query += ` AND a.fecha = CURDATE()`; }

    if (area)   { query += ` AND ar.nombre LIKE ?`; params.push(`%${area}%`); }
    if (piso)   { query += ` AND ar.piso = ?`;      params.push(piso); }
    if (estado) { query += ` AND a.estado = ?`;     params.push(estado); }

    query += ` ORDER BY a.fecha_hora_entrada DESC`;

    const [rows] = await pool.query(query, params);
    res.json({ registros: rows });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
};

exports.registrarManual = async (req, res) => {
  try {
    const { empleado_id, fecha, fecha_hora_entrada, fecha_hora_salida, tipo_marcacion, observacion } = req.body;

    await pool.query(
      `INSERT INTO asistencia (empleado_id, fecha, fecha_hora_entrada, fecha_hora_salida, tipo_marcacion, estado, observacion)
       VALUES (?, ?, ?, ?, ?, 'puntual', ?)
       ON DUPLICATE KEY UPDATE
       fecha_hora_entrada = VALUES(fecha_hora_entrada),
       fecha_hora_salida = VALUES(fecha_hora_salida),
       tipo_marcacion = VALUES(tipo_marcacion),
       observacion = VALUES(observacion)`,
      [empleado_id, fecha, fecha_hora_entrada, fecha_hora_salida, tipo_marcacion, observacion]
    );

    res.json({ mensaje: 'Registro guardado correctamente' });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
};

exports.getMiAsistencia = async (req, res) => {
  try {
    const { mes, anio } = req.query;
    const empleado_id = req.user.empleado_id;

    if (!empleado_id) {
      return res.status(400).json({ mensaje: 'Empleado no identificado' });
    }

    const [rows] = await pool.query(`
      SELECT 
        a.fecha,
        TIME_FORMAT(a.fecha_hora_entrada, '%H:%i') AS entrada,
        TIME_FORMAT(a.fecha_hora_salida, '%H:%i') AS salida,
        a.horas_trabajadas,
        a.estado
      FROM asistencia a
      WHERE a.empleado_id = ?
        AND YEAR(a.fecha) = ?
        AND MONTH(a.fecha) = ?
      ORDER BY a.fecha DESC
    `, [empleado_id, anio, mes]);

    const registros = rows.map(r => ({
      fecha: r.fecha,
      entrada: r.entrada || null,
      salida: r.salida || null,
      horas: r.horas_trabajadas || null,
      estado: r.estado ? r.estado.charAt(0).toUpperCase() + r.estado.slice(1) : null,
    }));

    res.json({ registros });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
};

exports.justificarAusencia = async (req, res) => {
  try {
    const { id } = req.params;
    const { observacion } = req.body;

    await pool.query(
      `UPDATE asistencia SET estado = 'justificado', observacion = ? WHERE id = ?`,
      [observacion, id]
    );

    res.json({ mensaje: 'Ausencia justificada correctamente' });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
};