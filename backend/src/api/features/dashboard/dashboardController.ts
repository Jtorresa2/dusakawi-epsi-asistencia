import pool from '../../../config/db';
import { Request, Response } from 'express';
import { getErrorMessage } from '../../shared/utils/errors';

interface IndicadoresRow {
  presentes_hoy: string | number | null;
  ausentes_hoy: string | number | null;
  tardanzas_hoy: string | number | null;
  puntualidad: string | number | null;
}

interface ResumenAreaRow {
  id: string;
  area: string;
  total: string | number;
  presentes: string | number | null;
  ausentes: string | number | null;
  tardanzas: string | number | null;
}

function getDateRange(periodo: string): { start: string; end: string } {
  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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
    case '├Ültimo a├▒o':
      return { start: `${yyyy - 1}-${mm}-${dd}`, end: hoyStr };
    default: // Hoy
      return { start: hoyStr, end: hoyStr };
  }
}

export const getIndicadores = async (req: Request, res: Response) => {
  try {
    const periodo = (req.query.periodo as string) || 'Hoy';
    const r = getDateRange(periodo);

    const { rows: indicadores } = await pool.query<IndicadoresRow>(`
      SELECT 
        COUNT(DISTINCT CASE WHEN a.status = 'on_time' OR a.status = 'late' THEN a.user_id END) AS presentes_hoy,
        COUNT(DISTINCT CASE WHEN a.status = 'absent' THEN a.user_id END) AS ausentes_hoy,
        COUNT(DISTINCT CASE WHEN a.status = 'late' THEN a.user_id END) AS tardanzas_hoy,
        ROUND(SUM(CASE WHEN a.status = 'on_time' THEN 1 ELSE 0 END) / COUNT(*) * 100, 1) AS puntualidad
      FROM attendances a
      WHERE a.date BETWEEN '${r.start}' AND '${r.end}'
    `);

    const { rows: permisos } = await pool.query(`
      SELECT COUNT(*) AS total FROM incidents
      WHERE status = 'approved'
        AND date BETWEEN '${r.start}' AND '${r.end}'
    `);

    const { rows: totalRegistrados } = await pool.query(`
      SELECT COUNT(*) AS total
      FROM users u
      WHERE u.active = true
    `);

    const { rows: asistenciaHoy } = await pool.query(`
      SELECT a.id, u.first_name AS nombre, u.first_surname AS apellido, a.date AS fecha, a.status AS estado,
        a.entry_timestamp AS fecha_hora_entrada, a.morning_departure_timestamp AS fecha_hora_salida_manana,
        a.afternoon_entry_timestamp AS fecha_hora_entrada_tarde, a.departure_timestamp AS fecha_hora_salida,
        a.worked_hours AS horas_trabajadas, a.late_minutes AS minutos_tardanza
      FROM attendances a
      JOIN users u ON a.user_id = u.id
      WHERE a.date = CURRENT_DATE
      ORDER BY a.entry_timestamp
      LIMIT 10
    `);
    const { rows: semanal } = await pool.query(`
      SELECT 
        TRIM(TO_CHAR(date, 'Day')) AS dia,
        SUM((status != 'absent')::int) AS presentes,
        SUM((status = 'absent')::int) AS ausentes
      FROM attendances
      WHERE date >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY date, TRIM(TO_CHAR(date, 'Day'))
      ORDER BY date
    `);
    const { rows: mensual } = await pool.query(`
      SELECT 
        EXTRACT(MONTH FROM date) AS mes,
        ROUND(SUM((status = 'on_time')::int) / COUNT(*) * 100, 1) AS puntualidad,
        ROUND(SUM((status = 'absent')::int) / COUNT(*) * 100, 1) AS ausentismo
      FROM attendances
      WHERE EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)
      GROUP BY EXTRACT(MONTH FROM date)
      ORDER BY mes
    `);

    const ind = indicadores[0];
    res.json({
      indicadores: {
        puntualidad: ind?.puntualidad || 0,
        presentes_hoy: ind?.presentes_hoy || 0,
        ausentes_hoy: ind?.ausentes_hoy || 0,
        tardanzas_hoy: ind?.tardanzas_hoy || 0,
        permisos_hoy: permisos[0]?.total || 0,
        total_registrados: totalRegistrados[0]?.total || 0,
      },
      registros: asistenciaHoy,
      semanal,
      mensual
    });
  } catch (err: unknown) {
    console.error('Dashboard error:', err);
    res.status(500).json({ mensaje: 'Error del servidor', error: getErrorMessage(err) });
  }
};

export const getResumenPorArea = async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query<ResumenAreaRow>(`
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

    const data = rows.map((r) => {
      const total = Number(r.total);
      const presentes = Number(r.presentes);
      const ausentes = Number(r.ausentes);
      const tardanzas = Number(r.tardanzas);
      return {
        id: r.id,
        area: r.area,
        presentes,
        ausentes,
        tardanzas,
        total,
        porcentaje_asistencia: total > 0
          ? Math.round(((presentes + tardanzas) / total) * 100)
          : 0,
      };
    });

    res.json(data);
  } catch (err: unknown) {
    console.error('Resumen por área error:', err);
    res.status(500).json({ mensaje: 'Error del servidor', error: getErrorMessage(err) });
  }
};
