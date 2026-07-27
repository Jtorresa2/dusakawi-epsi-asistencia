const pool = require('../config/db');

function getDateRange(periodo) {
  const fmt = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const hoy = new Date();
  const yyyy = hoy.getFullYear();
  const mm = String(hoy.getMonth() + 1).padStart(2, '0');
  const dd = String(hoy.getDate()).padStart(2, '0');
  const hoyStr = `${yyyy}-${mm}-${dd}`;

  switch (periodo) {
    case 'Esta semana': {
      const dayOfWeek = hoy.getDay();
      const lunesOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const lunes = new Date(hoy);
      lunes.setDate(hoy.getDate() - lunesOffset);
      const domingo = new Date(lunes);
      domingo.setDate(lunes.getDate() + 6);
      return { start: fmt(lunes), end: fmt(domingo) };
    }
    case 'Este mes': {
      const first = `${yyyy}-${mm}-01`;
      const ultimoDia = new Date(yyyy, hoy.getMonth() + 1, 0).getDate();
      const last = `${yyyy}-${mm}-${String(ultimoDia).padStart(2, '0')}`;
      return { start: first, end: last };
    }
    case 'Último año':
      return { start: `${yyyy - 1}-${mm}-${dd}`, end: hoyStr };
    default: // Hoy
      return { start: hoyStr, end: hoyStr };
  }
}

exports.getIndicadores = async (req, res) => {
  try {
    const periodo = req.query.periodo || 'Hoy';
    const r = getDateRange(periodo);

    // Indicadores filtrados por período
    const [indicadores] = await pool.query(`
      SELECT 
        COUNT(DISTINCT CASE WHEN a.estado = 'puntual' OR a.estado = 'tardanza' THEN a.empleado_id END) AS presentes_hoy,
        COUNT(DISTINCT CASE WHEN a.estado = 'ausente' THEN a.empleado_id END) AS ausentes_hoy,
        COUNT(DISTINCT CASE WHEN a.estado = 'tardanza' THEN a.empleado_id END) AS tardanzas_hoy,
        ROUND(SUM(CASE WHEN a.estado = 'puntual' THEN 1 ELSE 0 END) / COUNT(*) * 100, 1) AS puntualidad
      FROM asistencia a
      WHERE a.fecha BETWEEN '${r.start}' AND '${r.end}'
    `);

    // Horas extra en el período (usando columna calculada)
    const [extras] = await pool.query(`
      SELECT COALESCE(SUM(a.horas_extra), 0) AS horas_extras
      FROM asistencia a
      WHERE a.fecha BETWEEN '${r.start}' AND '${r.end}'
    `);

    // Permisos/incidencias aprobadas en el período
    const [permisos] = await pool.query(`
      SELECT COUNT(*) AS total FROM incidencias
      WHERE estado = 'aprobado'
        AND fecha BETWEEN '${r.start}' AND '${r.end}'
    `);

    const [asistenciaHoy] = await pool.query(`
      SELECT a.id, e.nombre, e.apellido, a.fecha, a.estado,
        a.fecha_hora_entrada, a.fecha_hora_salida_manana, a.fecha_hora_entrada_tarde, a.fecha_hora_salida,
        a.horas_trabajadas, a.minutos_tardanza
      FROM asistencia a
      JOIN empleado e ON a.empleado_id = e.id
      WHERE a.fecha = CURRENT_DATE
      ORDER BY a.fecha_hora_entrada
      LIMIT 10
    `);
    const [semanal] = await pool.query(`
      SELECT 
        TRIM(TO_CHAR(fecha, 'Day')) AS dia,
        SUM((estado != 'ausente')::int) AS presentes,
        SUM((estado = 'ausente')::int) AS ausentes
      FROM asistencia
      WHERE fecha >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY fecha, TRIM(TO_CHAR(fecha, 'Day'))
      ORDER BY fecha
    `);
    const [mensual] = await pool.query(`
      SELECT 
        EXTRACT(MONTH FROM fecha) AS mes,
        ROUND(SUM((estado = 'puntual')::int) / COUNT(*) * 100, 1) AS puntualidad,
        ROUND(SUM((estado = 'ausente')::int) / COUNT(*) * 100, 1) AS ausentismo
      FROM asistencia
      WHERE EXTRACT(YEAR FROM fecha) = EXTRACT(YEAR FROM CURRENT_DATE)
      GROUP BY EXTRACT(MONTH FROM fecha)
      ORDER BY mes
    `);

    const ind = indicadores[0] || {};
    res.json({
      indicadores: {
        puntualidad: ind.puntualidad || 0,
        presentes_hoy: ind.presentes_hoy || 0,
        ausentes_hoy: ind.ausentes_hoy || 0,
        tardanzas_hoy: ind.tardanzas_hoy || 0,
        horas_extras_hoy: extras[0]?.horas_extras || 0,
        permisos_hoy: permisos[0]?.total || 0,
      },
      registros: asistenciaHoy,
      semanal,
      mensual
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
};

exports.getResumenPorArea = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        ar.id,
        ar.nombre AS area,
        COUNT(a.id) AS total,
        SUM(CASE WHEN a.estado = 'puntual' THEN 1 ELSE 0 END) AS presentes,
        SUM(CASE WHEN a.estado = 'ausente' THEN 1 ELSE 0 END) AS ausentes,
        SUM(CASE WHEN a.estado = 'tardanza' THEN 1 ELSE 0 END) AS tardanzas
      FROM asistencia a
      JOIN empleado e ON a.empleado_id = e.id
      JOIN areas ar ON e.area_id = ar.id
      WHERE a.fecha = CURRENT_DATE
      GROUP BY ar.id, ar.nombre
      ORDER BY ar.nombre
    `);

    const data = rows.map((r) => ({
      id: r.id,
      area: r.area,
      presentes: Number(r.presentes),
      ausentes: Number(r.ausentes),
      tardanzas: Number(r.tardanzas),
      total: Number(r.total),
      porcentaje_asistencia: r.total > 0
        ? Math.round(((Number(r.presentes) + Number(r.tardanzas)) / Number(r.total)) * 100)
        : 0,
    }));

    res.json(data);
  } catch (err) {
    console.error('Resumen por área error:', err);
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
};