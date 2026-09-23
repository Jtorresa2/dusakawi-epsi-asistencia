const pool = require('../config/db');

exports.obtenerTodos = async (req, res) => {
  try {
    const [horarios] = await pool.query(`
      SELECT h.*, hd.id AS detalle_id, hd.day_of_week, hd.morning_entry AS hora_entrada_manana,
        hd.morning_exit AS hora_salida_manana, hd.afternoon_entry AS hora_entrada_tarde,
        hd.afternoon_exit AS hora_salida_tarde
      FROM schedules h
      LEFT JOIN schedule_details hd ON h.id = hd.schedule_id
      ORDER BY h.name, CASE hd.day_of_week WHEN 'Lunes' THEN 1 WHEN 'Martes' THEN 2 WHEN 'Miércoles' THEN 3 WHEN 'Jueves' THEN 4 WHEN 'Viernes' THEN 5 WHEN 'Sábado' THEN 6 WHEN 'Domingo' THEN 7 END
    `);
    const agrupados = {};
    horarios.forEach(r => {
      if (!agrupados[r.id]) {
        agrupados[r.id] = {
          id: r.id,
          nombre: r.name,
          tolerancia_minutos: r.tolerance_minutes,
          description: r.description,
          modality: r.modality,
          workday_type: r.workday_type,
          expected_hours: r.expected_hours,
          active: r.active,
          creado_en: r.created_at,
          detalles: []
        };
      }
      if (r.day_of_week) {
        agrupados[r.id].detalles.push({
          id: r.detalle_id,
          dia_semana: r.day_of_week,
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
      SELECT h.*, hd.id AS detalle_id, hd.day_of_week, hd.morning_entry AS hora_entrada_manana,
        hd.morning_exit AS hora_salida_manana, hd.afternoon_entry AS hora_entrada_tarde,
        hd.afternoon_exit AS hora_salida_tarde
      FROM schedules h
      LEFT JOIN schedule_details hd ON h.id = hd.schedule_id
      WHERE h.id = ?
      ORDER BY CASE hd.day_of_week WHEN 'Lunes' THEN 1 WHEN 'Martes' THEN 2 WHEN 'Miércoles' THEN 3 WHEN 'Jueves' THEN 4 WHEN 'Viernes' THEN 5 WHEN 'Sábado' THEN 6 WHEN 'Domingo' THEN 7 END
    `, [id]);
    if (horarios.length === 0) return res.status(404).json({ mensaje: 'Horario no encontrado' });
    const horario = {
      id: horarios[0].id,
      nombre: horarios[0].name,
      tolerancia_minutos: horarios[0].tolerance_minutos,
      description: horarios[0].description,
      modality: horarios[0].modality,
      workday_type: horarios[0].workday_type,
      expected_hours: horarios[0].expected_hours,
      active: horarios[0].active,
      detalles: horarios.filter(r => r.day_of_week).map(r => ({
        id: r.detalle_id,
        dia_semana: r.day_of_week,
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
    const { nombre, tolerancia_minutos, detalles, description, modality, workday_type } = req.body;
    await pool.query(
      'UPDATE schedules SET name = ?, tolerance_minutes = ?, description = COALESCE(?, description), modality = COALESCE(?, modality), workday_type = COALESCE(?, workday_type) WHERE id = ?',
      [nombre, tolerancia_minutos ?? 0, description ?? null, modality ?? null, workday_type ?? null, id]
    );
    if (detalles) {
      for (const d of detalles) {
        await pool.query(
          `UPDATE schedule_details SET morning_entry = ?::time, morning_exit = ?::time,
           afternoon_entry = ?::time, afternoon_exit = ?::time
           WHERE schedule_id = ? AND day_of_week = ?`,
          [d.hora_entrada_manana || null, d.hora_salida_manana || null, d.hora_entrada_tarde || null, d.hora_salida_tarde || null, id, d.dia_semana]
        );
      }
    }
    res.json({ mensaje: 'Horario actualizado correctamente' });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
};

// ========================================================
// Helpers y consultas reutilizables (port desde refactor/architecture)
// ========================================================

function esIdValido(value) {
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuid.test(value) || /^\d+$/.test(value);
}

function hoyLocal() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
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

async function aplicarAsignacion(client, { usuario_id, horario_id, vigencia_desde, vigencia_hasta, motivo, asignado_por }) {
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

function armarHorarioAgrupado(horarios) {
  return {
    id: horarios[0].id, nombre: horarios[0].nombre,
    modalidad: horarios[0].modalidad, tipo_jornada: horarios[0].tipo_jornada,
    descripcion: horarios[0].descripcion, horas_esperadas: horarios[0].horas_esperadas,
    activo: horarios[0].activo,
    tolerancia_minutos: horarios[0].tolerancia_minutos,
    tolerancia_salida_minutos: horarios[0].tolerancia_salida_minutos,
    es_por_defecto: horarios[0].es_por_defecto,
    creado_en: horarios[0].creado_en,
    detalles: horarios.filter((r) => r.dia_semana).map((r) => ({
      dia_semana: r.dia_semana,
      hora_entrada_manana: r.hora_entrada_manana,
      hora_salida_manana: r.hora_salida_manana,
      hora_entrada_tarde: r.hora_entrada_tarde,
      hora_salida_tarde: r.hora_salida_tarde,
    })),
  };
}

exports.crear = async (req, res) => {
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
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  } finally {
    client.release();
  }
};

exports.eliminar = async (req, res) => {
  const { id } = req.params;
  if (!esIdValido(String(id))) {
    return res.status(400).json({ mensaje: 'Id inválido' });
  }
  try {
    const [horario] = await pool.query('SELECT id FROM schedules WHERE id = ?', [id]);
    if (!horario.length) return res.status(404).json({ mensaje: 'Horario no encontrado' });

    const [asignaciones] = await pool.query(
      'SELECT COUNT(*) AS total FROM schedule_assignments WHERE schedule_id = ?',
      [id]
    );
    if (Number(asignaciones[0].total) > 0) {
      return res.status(400).json({ mensaje: 'No se puede eliminar: el horario tiene empleados asignados' });
    }

    await pool.query('DELETE FROM schedules WHERE id = ?', [id]);
    res.json({ mensaje: 'Horario eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
};

exports.asignar = async (req, res) => {
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
    const [usuario] = await pool.query('SELECT id FROM users WHERE id = ?', [usuario_id]);
    if (!usuario.length) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    const [horario] = await pool.query('SELECT id FROM schedules WHERE id = ?', [horario_id]);
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
      return res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
    } finally {
      client.release();
    }
  } catch (err) {
    return res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
};

exports.asignarMasivo = async (req, res) => {
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
    const [horario] = await pool.query('SELECT id FROM schedules WHERE id = ?', [horario_id]);
    if (!horario.length) return res.status(404).json({ mensaje: 'Horario no encontrado' });

    let usuarios;
    if (Array.isArray(usuario_ids) && usuario_ids.length > 0) {
      const ids = usuario_ids;
      const [rows] = await pool.query(
        'SELECT id FROM users WHERE id = ANY(?::uuid[]) AND active = TRUE',
        [ids]
      );
      usuarios = rows;
    } else {
      const where = ['u.active = TRUE'];
      const params = [];
      if (filtros.area_id != null) {
        where.push('u.area_id = ?');
        params.push(filtros.area_id);
      }
      if (filtros.cargo_id != null) {
        where.push('u.position_id = ?');
        params.push(filtros.cargo_id);
      }

      const [rows] = await pool.query(
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
      return res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
    } finally {
      client.release();
    }
  } catch (err) {
    return res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
};

exports.desasignar = async (req, res) => {
  const { usuario_id } = req.body;
  if (!usuario_id) {
    return res.status(400).json({ mensaje: 'usuario_id es obligatorio' });
  }

  try {
    const [usuario] = await pool.query('SELECT id FROM users WHERE id = ?', [usuario_id]);
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
      return res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
    } finally {
      client.release();
    }
  } catch (err) {
    return res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
};

exports.porDefecto = async (req, res) => {
  const { id } = req.params;
  if (!esIdValido(String(id))) {
    return res.status(400).json({ mensaje: 'Id inválido' });
  }
  const es_por_defecto = req.body.es_por_defecto === true;

  try {
    const [horario] = await pool.query('SELECT id FROM schedules WHERE id = ?', [id]);
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
      return res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
    } finally {
      client.release();
    }
  } catch (err) {
    return res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
};

exports.asignados = async (req, res) => {
  const { id } = req.params;
  if (!esIdValido(String(id))) {
    return res.status(400).json({ mensaje: 'Id inválido' });
  }
  try {
    const [horario] = await pool.query('SELECT id FROM schedules WHERE id = ?', [id]);
    if (!horario.length) return res.status(404).json({ mensaje: 'Horario no encontrado' });

    const [asignados] = await pool.query(`
      SELECT u.id, u.first_name AS nombres, u.first_surname AS apellidos, u.email AS correo
      FROM users u
      JOIN schedule_assignments a ON a.user_id = u.id
      WHERE a.schedule_id = ?
        AND a.valid_from <= CURRENT_DATE
        AND (a.valid_until IS NULL OR a.valid_until > CURRENT_DATE)
      ORDER BY u.first_name
    `, [id]);
    return res.json(asignados);
  } catch (err) {
    return res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
};

exports.miHorario = async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const [usuarios] = await pool.query(
      'SELECT u.id, u.schedule_id AS horario_id, u.first_name AS nombre, u.first_surname AS apellido FROM users u WHERE u.id = ?',
      [usuarioId]
    );
    if (!usuarios.length) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

    if (!usuarios[0].horario_id) {
      return res.json({ asignado: false, mensaje: 'No tienes horario asignado' });
    }

    const [horarios] = await pool.query(
      `${SELECT_SCHEDULE_ALIASED} WHERE h.id = ? ORDER BY ${ORDER_BY_DAY}`,
      [usuarios[0].horario_id]
    );

    if (!horarios.length) return res.status(404).json({ mensaje: 'Horario no encontrado' });

    return res.json({ asignado: true, horario: armarHorarioAgrupado(horarios) });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
};

exports.historial = async (req, res) => {
  const { usuarioId } = req.params;
  if (!esIdValido(String(usuarioId))) {
    return res.status(400).json({ mensaje: 'Id inválido' });
  }
  try {
    const [asignaciones] = await pool.query(`
      SELECT a.id, a.user_id AS usuario_id, a.schedule_id AS horario_id,
        a.valid_from AS vigencia_desde, a.valid_until AS vigencia_hasta,
        a.reason AS motivo, a.assigned_by AS asignado_por, a.created_at AS creado_en,
        h.name AS horario_nombre
      FROM schedule_assignments a
      JOIN schedules h ON h.id = a.schedule_id
      WHERE a.user_id = ?
      ORDER BY a.valid_from DESC
    `, [usuarioId]);
    return res.json(asignaciones);
  } catch (err) {
    return res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
};

exports.historialGlobal = async (req, res) => {
  try {
    const [asignaciones] = await pool.query(`
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
    return res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
};