import pool from '../config/db';
import { Request, Response } from 'express';
import { PoolClient } from 'pg';
import { HorarioRow, HorarioAgrupado, SqlParam } from '../types';
import { getErrorMessage } from '../utils/errors';

function hoyLocal(): string {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

async function aplicarAsignacion(
  client: PoolClient,
  { usuario_id, horario_id, vigencia_desde, vigencia_hasta, motivo, asignado_por }: {
    usuario_id: string; horario_id: string; vigencia_desde: string;
    vigencia_hasta: string | null; motivo: string; asignado_por: string;
  }
) {
  await client.query(
    `UPDATE schedule_assignments SET valid_until = $1::date - 1
     WHERE user_id = $2 AND valid_until IS NULL`,
    [vigencia_desde, usuario_id]
  );
  await client.query(
    `INSERT INTO schedule_assignments
       (user_id, schedule_id, valid_from, valid_until, reason, assigned_by)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [usuario_id, horario_id, vigencia_desde, vigencia_hasta, motivo, asignado_por]
  );
}

const SELECT_SCHEDULE_ALIASED = `
  SELECT h.id, h.name AS nombre, h.modality AS modalidad,
    h.workday_type AS tipo_jornada, h.description AS descripcion,
    h.expected_hours AS horas_esperadas, h.active AS activo,
    h.tolerance_minutes AS tolerancia_minutos,
    h.tolerance_departure_minutes AS tolerancia_salida_minutos,
    h.is_default AS es_por_defecto, h.created_at AS creado_en,
    hd.day_of_week AS dia_semana, hd.morning_entry AS hora_entrada_manana,
    hd.morning_exit AS hora_salida_manana, hd.afternoon_entry AS hora_entrada_tarde,
    hd.afternoon_exit AS hora_salida_tarde
  FROM schedules h
  LEFT JOIN schedule_details hd ON h.id = hd.schedule_id
`;

const ORDER_BY_DAY = `CASE hd.day_of_week WHEN 'Lunes' THEN 1 WHEN 'Martes' THEN 2 WHEN 'Miércoles' THEN 3 WHEN 'Jueves' THEN 4 WHEN 'Viernes' THEN 5 WHEN 'Sábado' THEN 6 WHEN 'Domingo' THEN 7 END`;

export const obtenerTodos = async (req: Request, res: Response) => {
  try {
    const { rows: horarios } = await pool.query<HorarioRow>(`${SELECT_SCHEDULE_ALIASED} ORDER BY h.id, ${ORDER_BY_DAY}`);
    const agrupados: Record<string, HorarioAgrupado> = {};
    horarios.forEach((r) => {
      if (!agrupados[r.id]) {
        agrupados[r.id] = {
          id: r.id, nombre: r.nombre, modalidad: r.modalidad,
          tipo_jornada: r.tipo_jornada, descripcion: r.descripcion,
          horas_esperadas: r.horas_esperadas, activo: r.activo,
          tolerancia_minutos: r.tolerancia_minutos,
          tolerancia_salida_minutos: r.tolerancia_salida_minutos,
          es_por_defecto: r.es_por_defecto,
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
    res.status(500).json({ mensaje: 'Error del servidor', error: getErrorMessage(err) });
  }
};

export const obtenerPorId = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { rows: horarios } = await pool.query<HorarioRow>(`${SELECT_SCHEDULE_ALIASED} WHERE h.id = $1 ORDER BY ${ORDER_BY_DAY}`, [id]);
    if (horarios.length === 0) return res.status(404).json({ mensaje: 'Horario no encontrado' });
    const horario: HorarioAgrupado = {
      id: horarios[0].id, nombre: horarios[0].nombre,
      modalidad: horarios[0].modalidad, tipo_jornada: horarios[0].tipo_jornada,
      descripcion: horarios[0].descripcion, horas_esperadas: horarios[0].horas_esperadas,
      activo: horarios[0].activo,
      tolerancia_minutos: horarios[0].tolerancia_minutos,
      tolerancia_salida_minutos: horarios[0].tolerancia_salida_minutos,
      es_por_defecto: horarios[0].es_por_defecto,
      creado_en: horarios[0].creado_en,
      detalles: horarios.filter((r) => r.dia_semana).map((r) => ({
        dia_semana: r.dia_semana!,
        hora_entrada_manana: r.hora_entrada_manana,
        hora_salida_manana: r.hora_salida_manana,
        hora_entrada_tarde: r.hora_entrada_tarde,
        hora_salida_tarde: r.hora_salida_tarde,
      }))
    };
    res.json(horario);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error del servidor', error: getErrorMessage(err) });
  }
};

export const crear = async (req: Request, res: Response) => {
  const {
    nombre, modalidad = 'strict', tipo_jornada = 'fixed',
    descripcion, horas_esperadas, tolerancia_minutos = 0,
    tolerancia_salida_minutos = 0, activo = true, detalles = []
  } = req.body;

  if (!nombre) return res.status(400).json({ mensaje: 'El nombre es obligatorio' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      `INSERT INTO schedules
         (name, modality, workday_type, description, expected_hours,
          tolerance_minutes, tolerance_departure_minutes, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [nombre, modalidad, tipo_jornada, descripcion, horas_esperadas,
       tolerancia_minutos, tolerancia_salida_minutos, activo]
    );
    const id = rows[0].id;

    if (Array.isArray(detalles) && detalles.length) {
      for (const d of detalles) {
        await client.query(
          `INSERT INTO schedule_details
             (schedule_id, day_of_week, morning_entry, morning_exit,
              afternoon_entry, afternoon_exit)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [id, d.dia_semana, d.hora_entrada_manana ?? null, d.hora_salida_manana ?? null,
           d.hora_entrada_tarde ?? null, d.hora_salida_tarde ?? null]
        );
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ mensaje: 'Horario creado correctamente', id });
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch {}
    res.status(500).json({ mensaje: 'Error del servidor', error: getErrorMessage(err) });
  } finally {
    client.release();
  }
};

export const actualizar = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { detalles } = req.body;

  const client = await pool.connect();
  try {
    const { rows: existe } = await pool.query('SELECT id FROM schedules WHERE id = $1', [id]);
    if (!existe.length) return res.status(404).json({ mensaje: 'Horario no encontrado' });

    await client.query('BEGIN');

    const campos: Record<string, string> = {
      nombre: 'name',
      modalidad: 'modality',
      tipo_jornada: 'workday_type',
      descripcion: 'description',
      horas_esperadas: 'expected_hours',
      tolerancia_minutos: 'tolerance_minutes',
      tolerancia_salida_minutos: 'tolerance_departure_minutes',
      activo: 'active',
    };
    const sets: string[] = [];
    const valores: SqlParam[] = [];
    for (const [campo, columna] of Object.entries(campos)) {
      if (req.body[campo] !== undefined) {
        sets.push(`${columna} = $${valores.length + 1}`);
        valores.push(req.body[campo]);
      }
    }
    if (sets.length) {
      valores.push(String(id));
      await client.query(
        `UPDATE schedules SET ${sets.join(', ')} WHERE id = $${valores.length}`,
        valores
      );
    }

    if (Array.isArray(detalles)) {
      for (const d of detalles) {
        await client.query(
          `INSERT INTO schedule_details
             (schedule_id, day_of_week, morning_entry, morning_exit,
              afternoon_entry, afternoon_exit)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (schedule_id, day_of_week) DO UPDATE SET
             morning_entry = EXCLUDED.morning_entry,
             morning_exit = EXCLUDED.morning_exit,
             afternoon_entry = EXCLUDED.afternoon_entry,
             afternoon_exit = EXCLUDED.afternoon_exit`,
          [id, d.dia_semana, d.hora_entrada_manana ?? null, d.hora_salida_manana ?? null,
           d.hora_entrada_tarde ?? null, d.hora_salida_tarde ?? null]
        );
      }
    }

    await client.query('COMMIT');
    res.json({ mensaje: 'Horario actualizado correctamente' });
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch {}
    res.status(500).json({ mensaje: 'Error del servidor', error: getErrorMessage(err) });
  } finally {
    client.release();
  }
};

export const eliminar = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const { rows: horario } = await pool.query('SELECT id FROM schedules WHERE id = $1', [id]);
    if (!horario.length) return res.status(404).json({ mensaje: 'Horario no encontrado' });

    const { rows: asignaciones } = await pool.query(
      'SELECT COUNT(*) AS total FROM schedule_assignments WHERE schedule_id = $1',
      [id]
    );
    if (Number(asignaciones[0].total) > 0) {
      return res.status(400).json({ mensaje: 'No se puede eliminar: el horario tiene empleados asignados' });
    }

    await pool.query('DELETE FROM schedules WHERE id = $1', [id]);
    res.json({ mensaje: 'Horario eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error del servidor', error: getErrorMessage(err) });
  }
};

export const asignar = async (req: Request, res: Response) => {
  const { usuario_id, horario_id, vigencia_desde, vigencia_hasta, motivo } = req.body;
  if (!usuario_id || !horario_id) {
    return res.status(400).json({ mensaje: 'usuario_id y horario_id son obligatorios' });
  }
  const desde = vigencia_desde || hoyLocal();
  const hasta = vigencia_hasta || null;
  if (hasta && hasta < hoyLocal()) {
    return res.status(400).json({ mensaje: 'La vigencia hasta no puede ser anterior a hoy' });
  }
  if (hasta && hasta < desde) {
    return res.status(400).json({ mensaje: 'La vigencia hasta no puede ser anterior a la vigencia desde' });
  }

  try {
    const { rows: usuario } = await pool.query('SELECT id FROM users WHERE id = $1', [usuario_id]);
    if (!usuario.length) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    const { rows: horario } = await pool.query('SELECT id FROM schedules WHERE id = $1', [horario_id]);
    if (!horario.length) return res.status(404).json({ mensaje: 'Horario no encontrado' });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await aplicarAsignacion(client, {
        usuario_id, horario_id, vigencia_desde: desde,
        vigencia_hasta: hasta, motivo, asignado_por: req.user.id
      });
      await client.query('COMMIT');
      return res.status(201).json({ mensaje: 'Horario asignado correctamente' });
    } catch (err) {
      try { await client.query('ROLLBACK'); } catch {}
      return res.status(500).json({ mensaje: 'Error del servidor', error: getErrorMessage(err) });
    } finally {
      client.release();
    }
  } catch (err) {
    return res.status(500).json({ mensaje: 'Error del servidor', error: getErrorMessage(err) });
  }
};

export const asignarMasivo = async (req: Request, res: Response) => {
  const { horario_id, filtros = {}, vigencia_desde, vigencia_hasta, motivo, usuario_ids } = req.body;
  if (!horario_id) {
    return res.status(400).json({ mensaje: 'horario_id es obligatorio' });
  }
  if (usuario_ids !== undefined && usuario_ids !== null && !Array.isArray(usuario_ids)) {
    return res.status(400).json({ mensaje: 'usuario_ids debe ser un arreglo de ids' });
  }
  const desde = vigencia_desde || hoyLocal();
  const hasta = vigencia_hasta || null;
  if (hasta && hasta < hoyLocal()) {
    return res.status(400).json({ mensaje: 'La vigencia hasta no puede ser anterior a hoy' });
  }
  if (hasta && hasta < desde) {
    return res.status(400).json({ mensaje: 'La vigencia hasta no puede ser anterior a la vigencia desde' });
  }

  try {
    const { rows: horario } = await pool.query('SELECT id FROM schedules WHERE id = $1', [horario_id]);
    if (!horario.length) return res.status(404).json({ mensaje: 'Horario no encontrado' });

    let usuarios: { id: string }[];
    if (Array.isArray(usuario_ids) && usuario_ids.length > 0) {
      const ids = usuario_ids;
      const { rows } = await pool.query<{ id: string }>(
        'SELECT id FROM users WHERE id = ANY($1::uuid[]) AND active = TRUE',
        [ids]
      );
      usuarios = rows;
    } else {
      const where = ['u.active = TRUE'];
      const params: SqlParam[] = [];
      if (filtros.area_id != null) {
        where.push(`u.area_id = $${params.length + 1}`);
        params.push(filtros.area_id);
      }
      if (filtros.cargo_id != null) {
        where.push(`u.position_id = $${params.length + 1}`);
        params.push(filtros.cargo_id);
      }

      const { rows } = await pool.query<{ id: string }>(
        `SELECT u.id FROM users u WHERE ${where.join(' AND ')}`,
        params
      );
      usuarios = rows;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const u of usuarios) {
        await aplicarAsignacion(client, {
          usuario_id: u.id, horario_id, vigencia_desde: desde,
          vigencia_hasta: hasta, motivo, asignado_por: req.user.id
        });
      }
      await client.query('COMMIT');
      return res.status(200).json({
        mensaje: `Horario asignado a ${usuarios.length} empleados correctamente`,
        cantidad: usuarios.length
      });
    } catch (err) {
      try { await client.query('ROLLBACK'); } catch {}
      return res.status(500).json({ mensaje: 'Error del servidor', error: getErrorMessage(err) });
    } finally {
      client.release();
    }
  } catch (err) {
    return res.status(500).json({ mensaje: 'Error del servidor', error: getErrorMessage(err) });
  }
};

export const desasignar = async (req: Request, res: Response) => {
  const { usuario_id } = req.body;
  if (!usuario_id) {
    return res.status(400).json({ mensaje: 'usuario_id es obligatorio' });
  }

  try {
    const { rows: usuario } = await pool.query('SELECT id FROM users WHERE id = $1', [usuario_id]);
    if (!usuario.length) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `UPDATE schedule_assignments SET valid_until = CURRENT_DATE
         WHERE user_id = $1 AND valid_until IS NULL`,
        [usuario_id]
      );
      await client.query('COMMIT');
      return res.status(200).json({ mensaje: 'Horario desasignado correctamente' });
    } catch (err) {
      try { await client.query('ROLLBACK'); } catch {}
      return res.status(500).json({ mensaje: 'Error del servidor', error: getErrorMessage(err) });
    } finally {
      client.release();
    }
  } catch (err) {
    return res.status(500).json({ mensaje: 'Error del servidor', error: getErrorMessage(err) });
  }
};

export const porDefecto = async (req: Request, res: Response) => {
  const { id } = req.params;
  const es_por_defecto = req.body.es_por_defecto === true;

  try {
    const { rows: horario } = await pool.query('SELECT id FROM schedules WHERE id = $1', [id]);
    if (!horario.length) return res.status(404).json({ mensaje: 'Horario no encontrado' });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      if (es_por_defecto) {
        await client.query('UPDATE schedules SET is_default = FALSE WHERE is_default = TRUE');
        await client.query('UPDATE schedules SET is_default = TRUE WHERE id = $1', [id]);
      } else {
        await client.query('UPDATE schedules SET is_default = FALSE WHERE id = $1', [id]);
      }
      await client.query('COMMIT');
      return res.json({ mensaje: 'Horario por defecto actualizado' });
    } catch (err) {
      try { await client.query('ROLLBACK'); } catch {}
      return res.status(500).json({ mensaje: 'Error del servidor', error: getErrorMessage(err) });
    } finally {
      client.release();
    }
  } catch (err) {
    return res.status(500).json({ mensaje: 'Error del servidor', error: getErrorMessage(err) });
  }
};

export const asignados = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const { rows: horario } = await pool.query('SELECT id FROM schedules WHERE id = $1', [id]);
    if (!horario.length) return res.status(404).json({ mensaje: 'Horario no encontrado' });

    const { rows: asignados } = await pool.query(`
      SELECT u.id, u.first_name AS nombres, u.first_surname AS apellidos, u.email AS correo
      FROM users u
      JOIN schedule_assignments a ON a.user_id = u.id
      WHERE a.schedule_id = $1
        AND a.valid_from <= CURRENT_DATE
        AND (a.valid_until IS NULL OR a.valid_until > CURRENT_DATE)
      ORDER BY u.first_name
    `, [id]);
    return res.json(asignados);
  } catch (err) {
    return res.status(500).json({ mensaje: 'Error del servidor', error: getErrorMessage(err) });
  }
};

export const miHorario = async (req: Request, res: Response) => {
  try {
    const usuarioId = req.user.id;
    const { rows: usuarios } = await pool.query(
      'SELECT u.id, u.schedule_id AS horario_id, u.first_name AS nombre, u.first_surname AS apellido FROM users u WHERE u.id = $1',
      [usuarioId]
    );
    if (!usuarios.length) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

    if (!usuarios[0].horario_id) {
      return res.json({ asignado: false, mensaje: 'No tienes horario asignado' });
    }

    const { rows: horarios } = await pool.query<HorarioRow>(
      `${SELECT_SCHEDULE_ALIASED} WHERE h.id = $1 ORDER BY ${ORDER_BY_DAY}`,
      [usuarios[0].horario_id]
    );

    if (!horarios.length) return res.status(404).json({ mensaje: 'Horario no encontrado' });

    const horario: HorarioAgrupado = {
      id: horarios[0].id, nombre: horarios[0].nombre,
      modalidad: horarios[0].modalidad, tipo_jornada: horarios[0].tipo_jornada,
      descripcion: horarios[0].descripcion, horas_esperadas: horarios[0].horas_esperadas,
      activo: horarios[0].activo,
      tolerancia_minutos: horarios[0].tolerancia_minutos,
      tolerancia_salida_minutos: horarios[0].tolerancia_salida_minutos,
      es_por_defecto: horarios[0].es_por_defecto,
      creado_en: horarios[0].creado_en,
      detalles: horarios.filter((r) => r.dia_semana).map((r) => ({
        dia_semana: r.dia_semana!,
        hora_entrada_manana: r.hora_entrada_manana,
        hora_salida_manana: r.hora_salida_manana,
        hora_entrada_tarde: r.hora_entrada_tarde,
        hora_salida_tarde: r.hora_salida_tarde,
      }))
    };

    return res.json({ asignado: true, horario });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error del servidor', error: getErrorMessage(err) });
  }
};

export const historial = async (req: Request, res: Response) => {
  const { usuarioId } = req.params;
  try {
    const { rows: asignaciones } = await pool.query(`
      SELECT a.id, a.user_id AS usuario_id, a.schedule_id AS horario_id,
        a.valid_from AS vigencia_desde, a.valid_until AS vigencia_hasta,
        a.reason AS motivo, a.assigned_by AS asignado_por, a.created_at AS creado_en,
        h.name AS horario_nombre
      FROM schedule_assignments a
      JOIN schedules h ON h.id = a.schedule_id
      WHERE a.user_id = $1
      ORDER BY a.valid_from DESC
    `, [usuarioId]);
    return res.json(asignaciones);
  } catch (err) {
    return res.status(500).json({ mensaje: 'Error del servidor', error: getErrorMessage(err) });
  }
};

export const historialGlobal = async (req: Request, res: Response) => {
  try {
    const { rows: asignaciones } = await pool.query(`
      WITH con_anterior AS (
        SELECT a.*,
          LAG(a.schedule_id) OVER (PARTITION BY a.user_id ORDER BY a.valid_from, a.id) AS horario_anterior_id
        FROM schedule_assignments a
      )
      SELECT
        CONCAT(emp.first_name, ' ', emp.first_surname) AS empleado,
        h.name AS horario_nuevo,
        hprev.name AS horario_anterior,
        ca.valid_from AS fecha,
        CONCAT(adm.first_name, ' ', adm.first_surname) AS usuario,
        ca.reason AS motivo
      FROM con_anterior ca
      JOIN users emp ON emp.id = ca.user_id
      JOIN schedules h ON h.id = ca.schedule_id
      LEFT JOIN schedules hprev ON hprev.id = ca.horario_anterior_id
      LEFT JOIN users adm ON adm.id = ca.assigned_by
      ORDER BY ca.valid_from DESC, ca.id DESC
    `);
    return res.json(asignaciones);
  } catch (err) {
    return res.status(500).json({ mensaje: 'Error del servidor', error: getErrorMessage(err) });
  }
};
