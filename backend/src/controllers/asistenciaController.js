const pool = require('../config/db');

exports.getRegistros = async (req, res) => {
  try {
    const { fecha, fecha_desde, fecha_hasta, area, piso, estado } = req.query;

    let query = `
      SELECT
        a.id, e.cedula,
        CONCAT(e.nombre, ' ', e.apellido) AS empleado,
        ar.nombre AS area, ar.piso, a.fecha,
        TO_CHAR(a.fecha_hora_entrada, 'HH24:MI') AS entrada1,
        TO_CHAR(a.fecha_hora_salida_manana, 'HH24:MI') AS salida1,
        TO_CHAR(a.fecha_hora_entrada_tarde, 'HH24:MI') AS entrada2,
        TO_CHAR(a.fecha_hora_salida, 'HH24:MI') AS salida2,
        a.horas_trabajadas, a.horas_extra, a.minutos_tardanza,
        a.tipo_marcacion, a.estado, a.observacion,
        EXTRACT(DOW FROM a.fecha) + 1 AS dia_semana
      FROM asistencia a
      JOIN empleado e ON a.empleado_id = e.id
      JOIN areas ar ON e.area_id = ar.id
      WHERE 1=1
    `;

    const params = [];

    if (fecha_desde && fecha_hasta) {
      query += ` AND a.fecha BETWEEN ? AND ?`;
      params.push(fecha_desde, fecha_hasta);
    } else if (fecha) {
      query += ` AND a.fecha = ?`;
      params.push(fecha);
    } else {
      query += ` AND a.fecha = CURRENT_DATE`;
    }

    if (area)   { query += ` AND ar.nombre LIKE ?`; params.push(`%${area}%`); }
    if (piso)   { query += ` AND ar.piso = ?`;      params.push(piso); }
    if (estado) { query += ` AND a.estado = ?`;     params.push(estado); }

    query += ` ORDER BY a.fecha DESC, a.fecha_hora_entrada DESC`;

    const [rows] = await pool.query(query, params);
    res.json({ registros: rows });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
};

exports.registrarManual = async (req, res) => {
  try {
    const { empleado_id, fecha, entrada1, salida1, entrada2, salida2, tipo_marcacion, observacion } = req.body;

    const fecha_e1 = `${fecha} ${entrada1}:00`;
    const fecha_s1 = salida1 ? `${fecha} ${salida1}:00` : null;
    const fecha_e2 = entrada2 ? `${fecha} ${entrada2}:00` : null;
    const fecha_s2 = salida2 ? `${fecha} ${salida2}:00` : null;

    await pool.query(
      `INSERT INTO asistencia
        (empleado_id, fecha, fecha_hora_entrada, fecha_hora_salida_manana, fecha_hora_entrada_tarde, fecha_hora_salida, tipo_marcacion, estado, observacion)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'puntual', ?)
       ON CONFLICT (empleado_id, fecha) DO UPDATE SET
        fecha_hora_entrada = EXCLUDED.fecha_hora_entrada,
        fecha_hora_salida_manana = EXCLUDED.fecha_hora_salida_manana,
        fecha_hora_entrada_tarde = EXCLUDED.fecha_hora_entrada_tarde,
        fecha_hora_salida = EXCLUDED.fecha_hora_salida,
        tipo_marcacion = EXCLUDED.tipo_marcacion,
        observacion = EXCLUDED.observacion`,
      [empleado_id, fecha, fecha_e1, fecha_s1, fecha_e2, fecha_s2, tipo_marcacion, observacion]
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
        TO_CHAR(a.fecha_hora_entrada, 'HH24:MI') AS entrada1,
        TO_CHAR(a.fecha_hora_salida_manana, 'HH24:MI') AS salida1,
        TO_CHAR(a.fecha_hora_entrada_tarde, 'HH24:MI') AS entrada2,
        TO_CHAR(a.fecha_hora_salida, 'HH24:MI') AS salida2,
        a.horas_trabajadas, a.estado,
        EXTRACT(DOW FROM a.fecha) + 1 AS dia_semana
      FROM asistencia a
      WHERE a.empleado_id = ?
        AND EXTRACT(YEAR FROM a.fecha) = ?
        AND EXTRACT(MONTH FROM a.fecha) = ?
      ORDER BY a.fecha DESC
    `, [empleado_id, anio, mes]);

    const registros = rows.map(r => ({
      fecha: r.fecha,
      entrada1: r.entrada1, salida1: r.salida1,
      entrada2: r.entrada2, salida2: r.salida2,
      horas: r.horas_trabajadas,
      estado: r.estado ? r.estado.charAt(0).toUpperCase() + r.estado.slice(1) : null,
      dia_semana: r.dia_semana,
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

exports.eliminarRegistro = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM asistencia WHERE id = ?', [id]);
    res.json({ mensaje: 'Registro eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
};

exports.actualizarRegistro = async (req, res) => {
  try {
    const { id } = req.params;
    const { entrada1, salida1, entrada2, salida2, fecha, tipo_marcacion, estado, observacion } = req.body;

    if (!fecha) {
      return res.status(400).json({ mensaje: 'Fecha requerida' });
    }

    const fecha_e1 = entrada1 ? `${fecha} ${entrada1}:00` : null;
    const fecha_s1 = salida1 ? `${fecha} ${salida1}:00` : null;
    const fecha_e2 = entrada2 ? `${fecha} ${entrada2}:00` : null;
    const fecha_s2 = salida2 ? `${fecha} ${salida2}:00` : null;

    await pool.query(
      `UPDATE asistencia SET
        fecha = ?,
        fecha_hora_entrada = ?,
        fecha_hora_salida_manana = ?,
        fecha_hora_entrada_tarde = ?,
        fecha_hora_salida = ?,
        tipo_marcacion = ?,
        estado = ?,
        observacion = ?
      WHERE id = ?`,
      [fecha, fecha_e1, fecha_s1, fecha_e2, fecha_s2, tipo_marcacion, estado, observacion, id]
    );

    res.json({ mensaje: 'Registro actualizado correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
};
