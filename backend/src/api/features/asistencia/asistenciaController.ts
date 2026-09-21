import pool from '../../../config/db';
import { Request, Response } from 'express';
import { SqlParam } from '../../shared/types';
import { getErrorMessage } from '../../shared/utils/errors';

interface MiAsistenciaRow {
  fecha: string | Date;
  entrada1: string | null;
  salida1: string | null;
  entrada2: string | null;
  salida2: string | null;
  horas_trabajadas: number | null;
  estado: string | null;
  dia_semana: number | null;
}

export const getRegistros = async (req: Request, res: Response) => {
  try {
    const { fecha, fecha_desde, fecha_hasta, area, piso, estado } = req.query;

    let query = `
      SELECT
        a.id, dd.document_number AS cedula,
        CONCAT(u.first_name, ' ', u.first_surname) AS empleado,
        ar.name AS area, NULLIF(regexp_replace(fl.name, '\\D', '', 'g'), '')::int AS piso, a.date AS fecha,
        TO_CHAR(a.entry_timestamp, 'HH24:MI') AS entrada1,
        TO_CHAR(a.morning_departure_timestamp, 'HH24:MI') AS salida1,
        TO_CHAR(a.afternoon_entry_timestamp, 'HH24:MI') AS entrada2,
        TO_CHAR(a.departure_timestamp, 'HH24:MI') AS salida2,
        a.worked_hours AS horas_trabajadas, a.late_minutes AS minutos_tardanza,
        a.mark_type AS tipo_marcacion, a.status AS estado, a.observation AS observacion,
        CASE WHEN a.entry_timestamp IS NOT NULL
               AND a.morning_departure_timestamp IS NOT NULL
               AND a.afternoon_entry_timestamp IS NOT NULL
               AND a.departure_timestamp IS NOT NULL
             THEN 'complete' ELSE 'open' END AS marcacion_estado,
        EXTRACT(DOW FROM a.date) + 1 AS dia_semana,
        h.name AS horario_nombre, h.modality AS horario_modalidad,
        TO_CHAR(hd.morning_entry, 'HH24:MI') AS esperado_entrada_manana,
        TO_CHAR(hd.morning_exit, 'HH24:MI') AS esperado_salida_manana,
        TO_CHAR(hd.afternoon_entry, 'HH24:MI') AS esperado_entrada_tarde,
        TO_CHAR(hd.afternoon_exit, 'HH24:MI') AS esperado_salida_tarde
      FROM attendances a
      JOIN users u ON a.user_id = u.id
      JOIN areas ar ON u.area_id = ar.id
      LEFT JOIN floors fl ON ar.floor_id = fl.id
      LEFT JOIN document_details dd ON dd.user_id = u.id
      LEFT JOIN schedules h ON u.schedule_id = h.id
      LEFT JOIN schedule_details hd ON hd.schedule_id = u.schedule_id
        AND hd.day_of_week = CASE EXTRACT(DOW FROM a.date)
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

    const params: SqlParam[] = [];

    if (fecha_desde && fecha_hasta) {
      query += ` AND a.date BETWEEN $1 AND $2`;
      params.push(String(fecha_desde), String(fecha_hasta));
    } else if (fecha) {
      query += ` AND a.date = $1`;
      params.push(String(fecha));
    } else {
      query += ` AND a.date = CURRENT_DATE`;
    }

    if (area)   { query += ` AND ar.name LIKE $${params.length + 1}`; params.push(`%${area}%`); }
    if (piso)   { query += ` AND NULLIF(regexp_replace(fl.name, '\\D', '', 'g'), '')::int = $${params.length + 1}`; params.push(Number(piso)); }
    if (estado) { query += ` AND a.status = $${params.length + 1}`;     params.push(String(estado)); }

    query += ` ORDER BY a.date DESC, a.entry_timestamp DESC`;

    const { rows } = await pool.query(query, params);
    res.json({ registros: rows });
  } catch (err: unknown) {
    res.status(500).json({ mensaje: 'Error del servidor', error: getErrorMessage(err) });
  }
};

export const getMiAsistencia = async (req: Request, res: Response) => {
  try {
    const { mes, anio } = req.query;
    const usuarioId = req.user.id;

    if (!usuarioId) {
      return res.status(400).json({ mensaje: 'Usuario no identificado' });
    }

    const { rows } = await pool.query<MiAsistenciaRow>(`
      SELECT
        a.date AS fecha,
        TO_CHAR(a.entry_timestamp, 'HH24:MI') AS entrada1,
        TO_CHAR(a.morning_departure_timestamp, 'HH24:MI') AS salida1,
        TO_CHAR(a.afternoon_entry_timestamp, 'HH24:MI') AS entrada2,
        TO_CHAR(a.departure_timestamp, 'HH24:MI') AS salida2,
        a.worked_hours AS horas_trabajadas, a.status AS estado,
        EXTRACT(DOW FROM a.date) + 1 AS dia_semana
      FROM attendances a
      WHERE a.user_id = $1
        AND EXTRACT(YEAR FROM a.date) = $2
        AND EXTRACT(MONTH FROM a.date) = $3
      ORDER BY a.date DESC
    `, [usuarioId, anio, mes]);

    const registros = rows.map((r) => ({
      fecha: r.fecha,
      entrada1: r.entrada1, salida1: r.salida1,
      entrada2: r.entrada2, salida2: r.salida2,
      horas: r.horas_trabajadas,
      estado: r.estado || null,
      dia_semana: r.dia_semana,
    }));

    res.json({ registros });
  } catch (err: unknown) {
    res.status(500).json({ mensaje: 'Error del servidor', error: getErrorMessage(err) });
  }
};
