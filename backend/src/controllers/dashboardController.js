const pool = require('../config/db');

exports.getIndicadores = async (req, res) => {
  try {
    const [indicadores] = await pool.query('SELECT * FROM vista_indicadores');
    const [asistenciaHoy] = await pool.query('SELECT * FROM vista_asistencia_hoy LIMIT 10');
    const [semanal] = await pool.query(`
      SELECT 
        DAYNAME(fecha) AS dia,
        SUM(estado != 'ausente') AS presentes,
        SUM(estado = 'ausente') AS ausentes
      FROM asistencia
      WHERE fecha >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY fecha, DAYNAME(fecha)
      ORDER BY fecha
    `);
    const [mensual] = await pool.query(`
      SELECT 
        MONTH(fecha) AS mes,
        ROUND(SUM(estado = 'puntual') / COUNT(*) * 100, 1) AS puntualidad,
        ROUND(SUM(estado = 'ausente') / COUNT(*) * 100, 1) AS ausentismo
      FROM asistencia
      WHERE YEAR(fecha) = YEAR(CURDATE())
      GROUP BY MONTH(fecha)
      ORDER BY mes
    `);

    res.json({
      indicadores: indicadores[0] || {},
      registros: asistenciaHoy,
      semanal,
      mensual
    });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
};