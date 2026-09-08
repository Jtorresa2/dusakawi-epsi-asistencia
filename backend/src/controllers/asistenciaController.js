const pool = require('../config/db');

exports.getRegistros = async (req, res) => {
  try {
    const { fecha, fecha_desde, fecha_hasta, area, piso, estado } = req.query;

    let query = `
      SELECT
        a.id, u.cedula,
        CONCAT(u.nombre, ' ', u.apellido) AS empleado,
        ar.nombre AS area, ar.piso, a.fecha,
        TO_CHAR(a.fecha_hora_entrada, 'HH24:MI') AS entrada1,
        TO_CHAR(a.fecha_hora_salida_manana, 'HH24:MI') AS salida1,
        TO_CHAR(a.fecha_hora_entrada_tarde, 'HH24:MI') AS entrada2,
        TO_CHAR(a.fecha_hora_salida, 'HH24:MI') AS salida2,
        a.horas_trabajadas, a.minutos_tardanza,
        a.tipo_marcacion, a.estado, a.observacion,
        CASE WHEN a.fecha_hora_entrada IS NOT NULL
               AND a.fecha_hora_salida_manana IS NOT NULL
               AND a.fecha_hora_entrada_tarde IS NOT NULL
               AND a.fecha_hora_salida IS NOT NULL
             THEN 'completa' ELSE 'abierta' END AS marcacion_estado,
        EXTRACT(DOW FROM a.fecha) + 1 AS dia_semana,
        h.nombre AS horario_nombre, h.modalidad AS horario_modalidad,
        TO_CHAR(hd.hora_entrada_manana, 'HH24:MI') AS esperado_entrada_manana,
        TO_CHAR(hd.hora_salida_manana, 'HH24:MI') AS esperado_salida_manana,
        TO_CHAR(hd.hora_entrada_tarde, 'HH24:MI') AS esperado_entrada_tarde,
        TO_CHAR(hd.hora_salida_tarde, 'HH24:MI') AS esperado_salida_tarde
      FROM asistencia a
      JOIN usuarios u ON a.usuario_id = u.id
      JOIN areas ar ON u.area_id = ar.id
      LEFT JOIN horarios h ON u.horario_id = h.id
      LEFT JOIN horario_detalle hd ON hd.horario_id = u.horario_id
        AND hd.dia_semana = CASE EXTRACT(DOW FROM a.fecha)
          WHEN 0 THEN 'Domingo'
          WHEN 1 THEN 'Lunes'
          WHEN 2 THEN 'Martes'
          WHEN 3 THEN 'Miércoles'
          WHEN 4 THEN 'Jueves'
          WHEN 5 THEN 'Viernes'
          WHEN 6 THEN 'Sábado'
        END
      WHERE 1=1
    `;

    const params = [];

    if (fecha_desde && fecha_hasta) {
      query += ` AND a.fecha BETWEEN $1 AND $2`;
      params.push(fecha_desde, fecha_hasta);
    } else if (fecha) {
      query += ` AND a.fecha = $1`;
      params.push(fecha);
    } else {
      query += ` AND a.fecha = CURRENT_DATE`;
    }

    if (area)   { query += ` AND ar.nombre LIKE $${params.length + 1}`; params.push(`%${area}%`); }
    if (piso)   { query += ` AND ar.piso = $${params.length + 1}`;      params.push(piso); }
    if (estado) { query += ` AND a.estado = $${params.length + 1}`;     params.push(estado); }

    query += ` ORDER BY a.fecha DESC, a.fecha_hora_entrada DESC`;

    const { rows } = await pool.query(query, params);
    res.json({ registros: rows });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
};

exports.getMiAsistencia = async (req, res) => {
  try {
    const { mes, anio } = req.query;
    const usuarioId = req.user.id;

    if (!usuarioId) {
      return res.status(400).json({ mensaje: 'Usuario no identificado' });
    }

    const { rows } = await pool.query(`
      SELECT
        a.fecha,
        TO_CHAR(a.fecha_hora_entrada, 'HH24:MI') AS entrada1,
        TO_CHAR(a.fecha_hora_salida_manana, 'HH24:MI') AS salida1,
        TO_CHAR(a.fecha_hora_entrada_tarde, 'HH24:MI') AS entrada2,
        TO_CHAR(a.fecha_hora_salida, 'HH24:MI') AS salida2,
        a.horas_trabajadas, a.estado,
        EXTRACT(DOW FROM a.fecha) + 1 AS dia_semana
      FROM asistencia a
      WHERE a.usuario_id = $1
        AND EXTRACT(YEAR FROM a.fecha) = $2
        AND EXTRACT(MONTH FROM a.fecha) = $3
      ORDER BY a.fecha DESC
    `, [usuarioId, anio, mes]);

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
