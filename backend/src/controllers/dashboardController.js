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
        COUNT(DISTINCT CASE WHEN LOWER(a.estado) = 'puntual' OR LOWER(a.estado) = 'tardanza' THEN a.user_id END) AS presentes_hoy,
        COUNT(DISTINCT CASE WHEN LOWER(a.estado) = 'ausente' THEN a.user_id END) AS ausentes_hoy,
        COUNT(DISTINCT CASE WHEN LOWER(a.estado) = 'tardanza' THEN a.user_id END) AS tardanzas_hoy,
        CASE WHEN COUNT(*) > 0 THEN ROUND(SUM(CASE WHEN LOWER(a.estado) = 'puntual' THEN 1 ELSE 0 END)::numeric / COUNT(*) * 100, 1) ELSE 100 END AS puntualidad
      FROM attendances a
      WHERE DATE(a.created_at) BETWEEN ? AND ?
    `, [r.start, r.end]);

    // Horas extra en el período
    const [extras] = await pool.query(`
      SELECT COALESCE(SUM(a.horas_extra), 0) AS horas_extras
      FROM attendances a
      WHERE DATE(a.created_at) BETWEEN ? AND ?
    `, [r.start, r.end]);

    // Permisos/incidencias aprobadas en el período
    const [permisos] = await pool.query(`
      SELECT COUNT(*) AS total FROM incidents
      WHERE LOWER(status) IN ('aprobado', 'aprobada')
        AND DATE(created_at) BETWEEN ? AND ?
    `, [r.start, r.end]);

    const [asistenciaHoy] = await pool.query(`
      SELECT
        a.id,
        u.first_name AS nombre,
        u.first_surname AS apellido,
        TO_CHAR(a.created_at, 'YYYY-MM-DD') AS fecha,
        a.estado,
        TO_CHAR(a.first_entry_time, 'HH24:MI') AS fecha_hora_entrada,
        TO_CHAR(a.first_departure_time, 'HH24:MI') AS fecha_hora_salida_manana,
        TO_CHAR(a.last_entry_time, 'HH24:MI') AS fecha_hora_entrada_tarde,
        TO_CHAR(a.last_departure_time, 'HH24:MI') AS fecha_hora_salida,
        a.horas_trabajadas,
        a.minutos_tardanza
      FROM attendances a
      JOIN users u ON a.user_id = u.id
      WHERE DATE(a.created_at) = CURRENT_DATE
      ORDER BY a.first_entry_time ASC NULLS LAST
      LIMIT 10
    `);

    const [semanal] = await pool.query(`
      SELECT 
        TRIM(TO_CHAR(created_at, 'Day')) AS dia,
        SUM((LOWER(estado) != 'ausente')::int) AS presentes,
        SUM((LOWER(estado) = 'ausente')::int) AS ausentes
      FROM attendances
      WHERE DATE(created_at) >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(created_at), TRIM(TO_CHAR(created_at, 'Day'))
      ORDER BY DATE(created_at)
    `);

    const [mensual] = await pool.query(`
      SELECT 
        EXTRACT(MONTH FROM created_at) AS mes,
        ROUND(SUM((LOWER(estado) = 'puntual')::int)::numeric / GREATEST(COUNT(*), 1) * 100, 1) AS puntualidad,
        ROUND(SUM((LOWER(estado) = 'ausente')::int)::numeric / GREATEST(COUNT(*), 1) * 100, 1) AS ausentismo
      FROM attendances
      WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
      GROUP BY EXTRACT(MONTH FROM created_at)
      ORDER BY mes
    `);

    const ind = indicadores[0] || {};
    res.json({
      indicadores: {
        puntualidad: ind.puntualidad || 100,
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
        ar.name AS area,
        COUNT(a.id) AS total,
        SUM(CASE WHEN LOWER(a.estado) = 'puntual' THEN 1 ELSE 0 END) AS presentes,
        SUM(CASE WHEN LOWER(a.estado) = 'ausente' THEN 1 ELSE 0 END) AS ausentes,
        SUM(CASE WHEN LOWER(a.estado) = 'tardanza' THEN 1 ELSE 0 END) AS tardanzas
      FROM attendances a
      JOIN users u ON a.user_id = u.id
      JOIN areas ar ON u.area_id = ar.id
      WHERE DATE(a.created_at) = CURRENT_DATE
      GROUP BY ar.id, ar.name
      ORDER BY ar.name
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