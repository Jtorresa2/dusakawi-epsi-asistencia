const pool = require('../config/db');

exports.obtenerTodos = async (req, res) => {
  try {
    const [horarios] = await pool.query(`
      SELECT h.*, hd.dia_semana, hd.hora_entrada_manana, hd.hora_salida_manana,
        hd.hora_entrada_tarde, hd.hora_salida_tarde
      FROM horarios h
      LEFT JOIN horario_detalle hd ON h.id = hd.horario_id
      ORDER BY h.id, FIELD(hd.dia_semana, 'Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo')
    `);
    const agrupados = {};
    horarios.forEach(r => {
      if (!agrupados[r.id]) {
        agrupados[r.id] = {
          id: r.id, nombre: r.nombre, tolerancia_minutos: r.tolerancia_minutos,
          creado_en: r.creado_en, detalles: []
        };
      }
      if (r.dia_semana) {
        agrupados[r.id].detalles.push({
          dia_semana: r.dia_semana,
          hora_entrada_manana: r.hora_entrada_manana,
          hora_salida_manana: r.hora_salida_manana,
          hora_entrada_tarde: r.hora_entrada_tarde,
          hora_salida_tarde: r.hora_salida_tarde,
        });
      }
    });
    res.json(Object.values(agrupados));
  } catch (err) {
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
};

exports.obtenerPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const [horarios] = await pool.query(`
      SELECT h.*, hd.dia_semana, hd.hora_entrada_manana, hd.hora_salida_manana,
        hd.hora_entrada_tarde, hd.hora_salida_tarde
      FROM horarios h
      LEFT JOIN horario_detalle hd ON h.id = hd.horario_id
      WHERE h.id = ?
      ORDER BY FIELD(hd.dia_semana, 'Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo')
    `, [id]);
    if (horarios.length === 0) return res.status(404).json({ mensaje: 'Horario no encontrado' });
    const horario = {
      id: horarios[0].id, nombre: horarios[0].nombre,
      tolerancia_minutos: horarios[0].tolerancia_minutos,
      detalles: horarios.filter(r => r.dia_semana).map(r => ({
        dia_semana: r.dia_semana,
        hora_entrada_manana: r.hora_entrada_manana,
        hora_salida_manana: r.hora_salida_manana,
        hora_entrada_tarde: r.hora_entrada_tarde,
        hora_salida_tarde: r.hora_salida_tarde,
      }))
    };
    res.json(horario);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
};

exports.actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, tolerancia_minutos, detalles } = req.body;
    await pool.query('UPDATE horarios SET nombre = ?, tolerancia_minutos = ? WHERE id = ?', [nombre, tolerancia_minutos, id]);
    if (detalles) {
      for (const d of detalles) {
        await pool.query(
          `UPDATE horario_detalle SET hora_entrada_manana = ?, hora_salida_manana = ?,
           hora_entrada_tarde = ?, hora_salida_tarde = ?
           WHERE horario_id = ? AND dia_semana = ?`,
          [d.hora_entrada_manana, d.hora_salida_manana, d.hora_entrada_tarde, d.hora_salida_tarde, id, d.dia_semana]
        );
      }
    }
    res.json({ mensaje: 'Horario actualizado correctamente' });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
};
