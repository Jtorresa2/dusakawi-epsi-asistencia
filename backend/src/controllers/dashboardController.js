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

function statusDisplay(status) {
  if (status === 'on_time') return 'puntual';
  if (status === 'late') return 'tardanza';
  if (status === 'absent') return 'ausente';
  if (status === 'justified') return 'justificado';
  return status || 'puntual';
}

exports.getIndicadores = async (req, res) => {
  try {
    const periodo = req.query.periodo || 'Hoy';
    const r = getDateRange(periodo);

    // Indicadores filtrados por período
    const [indicadores] = await pool.query(`
      SELECT 
        COUNT(DISTINCT CASE WHEN a.status IN ('on_time','late') THEN a.user_id END) AS presentes_hoy,
        COUNT(DISTINCT CASE WHEN a.status = 'absent' THEN a.user_id END) AS ausentes_hoy,
        COUNT(DISTINCT CASE WHEN a.status = 'late' THEN a.user_id END) AS tardanzas_hoy,
        CASE WHEN COUNT(*) > 0 THEN ROUND(SUM(CASE WHEN a.status = 'on_time' THEN 1 ELSE 0 END)::numeric / COUNT(*) * 100, 1) ELSE 100 END AS puntualidad
      FROM attendances a
      WHERE a.date BETWEEN ?::date AND ?::date
    `, [r.start, r.end]);

    // Horas extra en el período
    const [extras] = await pool.query(`
      SELECT COALESCE(SUM(a.extra_hours), 0) AS horas_extras
      FROM attendances a
      WHERE a.date BETWEEN ?::date AND ?::date
    `, [r.start, r.end]);

    // Permisos/incidencias aprobadas en el período
    const [permisos] = await pool.query(`
      SELECT COUNT(*) AS total FROM incidents
      WHERE LOWER(status) IN ('approved', 'aprobado', 'aprobada')
        AND DATE(created_at) BETWEEN ? AND ?
    `, [r.start, r.end]);

    const [asistenciaHoy] = await pool.query(`
      SELECT
        a.id,
        u.first_name AS nombre,
        u.first_surname AS apellido,
        TO_CHAR(a.date, 'YYYY-MM-DD') AS fecha,
        a.status AS estado,
        TO_CHAR(a.entry_timestamp, 'HH24:MI') AS fecha_hora_entrada,
        TO_CHAR(a.morning_departure_timestamp, 'HH24:MI') AS fecha_hora_salida_manana,
        TO_CHAR(a.afternoon_entry_timestamp, 'HH24:MI') AS fecha_hora_entrada_tarde,
        TO_CHAR(a.departure_timestamp, 'HH24:MI') AS fecha_hora_salida,
        a.worked_hours AS horas_trabajadas,
        a.late_minutes AS minutos_tardanza
      FROM attendances a
      JOIN users u ON a.user_id = u.id
      WHERE a.date = CURRENT_DATE
      ORDER BY a.entry_timestamp ASC NULLS LAST
      LIMIT 10
    `);

    const registros = (asistenciaHoy || []).map((r) => ({ ...r, estado: statusDisplay(r.estado) }));

    const [semanal] = await pool.query(`
      SELECT 
        TRIM(TO_CHAR(date, 'Day')) AS dia,
        SUM((status != 'absent')::int) AS presentes,
        SUM((status = 'absent')::int) AS ausentes
      FROM attendances
      WHERE date >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY date, TRIM(TO_CHAR(date, 'Day'))
      ORDER BY date
    `);

    const [mensual] = await pool.query(`
      SELECT 
        EXTRACT(MONTH FROM date) AS mes,
        ROUND(SUM((status = 'on_time')::int)::numeric / GREATEST(COUNT(*), 1) * 100, 1) AS puntualidad,
        ROUND(SUM((status = 'absent')::int)::numeric / GREATEST(COUNT(*), 1) * 100, 1) AS ausentismo
      FROM attendances
      WHERE EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)
      GROUP BY EXTRACT(MONTH FROM date)
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
      registros,
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
        SUM(CASE WHEN a.status = 'on_time' THEN 1 ELSE 0 END) AS presentes,
        SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) AS ausentes,
        SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) AS tardanzas
      FROM attendances a
      JOIN users u ON a.user_id = u.id
      JOIN areas ar ON u.area_id = ar.id
      WHERE a.date = CURRENT_DATE
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