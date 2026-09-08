const pool = require('../config/db');

function hoyLocal() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

// Registra una asignación (cierra la vigencia previa abierta, inserta la nueva
// y sincroniza la caché usuarios.horario_id) dentro de la transacción del caller.
async function aplicarAsignacion(client, { usuario_id, horario_id, vigencia_desde, vigencia_hasta, motivo, asignado_por }) {
  await client.query(
    `UPDATE asignaciones_horario SET vigencia_hasta = $1::date - 1
     WHERE usuario_id = $2 AND vigencia_hasta IS NULL`,
    [vigencia_desde, usuario_id]
  );
  await client.query(
    `INSERT INTO asignaciones_horario
       (usuario_id, horario_id, vigencia_desde, vigencia_hasta, motivo, asignado_por)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [usuario_id, horario_id, vigencia_desde, vigencia_hasta, motivo, asignado_por]
  );
}

exports.obtenerTodos = async (req, res) => {
  try {
    const { rows: horarios } = await pool.query(`
      SELECT h.*, hd.dia_semana, hd.hora_entrada_manana, hd.hora_salida_manana,
        hd.hora_entrada_tarde, hd.hora_salida_tarde
      FROM horarios h
      LEFT JOIN horario_detalle hd ON h.id = hd.horario_id
      ORDER BY h.id, CASE hd.dia_semana WHEN 'Lunes' THEN 1 WHEN 'Martes' THEN 2 WHEN 'Miércoles' THEN 3 WHEN 'Jueves' THEN 4 WHEN 'Viernes' THEN 5 WHEN 'Sábado' THEN 6 WHEN 'Domingo' THEN 7 END
    `);
    const agrupados = {};
    horarios.forEach(r => {
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
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
};

exports.obtenerPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows: horarios } = await pool.query(`
      SELECT h.*, hd.dia_semana, hd.hora_entrada_manana, hd.hora_salida_manana,
        hd.hora_entrada_tarde, hd.hora_salida_tarde
      FROM horarios h
      LEFT JOIN horario_detalle hd ON h.id = hd.horario_id
      WHERE h.id = $1
      ORDER BY CASE hd.dia_semana WHEN 'Lunes' THEN 1 WHEN 'Martes' THEN 2 WHEN 'Miércoles' THEN 3 WHEN 'Jueves' THEN 4 WHEN 'Viernes' THEN 5 WHEN 'Sábado' THEN 6 WHEN 'Domingo' THEN 7 END
    `, [id]);
    if (horarios.length === 0) return res.status(404).json({ mensaje: 'Horario no encontrado' });
    const horario = {
      id: horarios[0].id, nombre: horarios[0].nombre,
      modalidad: horarios[0].modalidad, tipo_jornada: horarios[0].tipo_jornada,
      descripcion: horarios[0].descripcion, horas_esperadas: horarios[0].horas_esperadas,
      activo: horarios[0].activo,
      tolerancia_minutos: horarios[0].tolerancia_minutos,
      tolerancia_salida_minutos: horarios[0].tolerancia_salida_minutos,
      es_por_defecto: horarios[0].es_por_defecto,
      creado_en: horarios[0].creado_en,
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

exports.crear = async (req, res) => {
  const {
    nombre, modalidad = 'estricto', tipo_jornada = 'fija',
    descripcion, horas_esperadas, tolerancia_minutos = 0,
    tolerancia_salida_minutos = 0, activo = true, detalles = []
  } = req.body;

  if (!nombre) return res.status(400).json({ mensaje: 'El nombre es obligatorio' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      `INSERT INTO horarios
         (nombre, modalidad, tipo_jornada, descripcion, horas_esperadas,
          tolerancia_minutos, tolerancia_salida_minutos, activo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [nombre, modalidad, tipo_jornada, descripcion, horas_esperadas,
       tolerancia_minutos, tolerancia_salida_minutos, activo]
    );
    const id = Number(rows[0].id);

    if (Array.isArray(detalles) && detalles.length) {
      for (const d of detalles) {
        await client.query(
          `INSERT INTO horario_detalle
             (horario_id, dia_semana, hora_entrada_manana, hora_salida_manana,
              hora_entrada_tarde, hora_salida_tarde)
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

exports.actualizar = async (req, res) => {
  const { id } = req.params;
  const { detalles } = req.body;

  const client = await pool.connect();
  try {
    const { rows: existe } = await pool.query('SELECT id FROM horarios WHERE id = $1', [id]);
    if (!existe.length) return res.status(404).json({ mensaje: 'Horario no encontrado' });

    await client.query('BEGIN');

    const campos = [
      'nombre', 'modalidad', 'tipo_jornada', 'descripcion', 'horas_esperadas',
      'tolerancia_minutos', 'tolerancia_salida_minutos', 'activo'
    ];
    const sets = [];
    const valores = [];
    for (const campo of campos) {
      if (req.body[campo] !== undefined) {
        sets.push(`${campo} = $${valores.length + 1}`);
        valores.push(req.body[campo]);
      }
    }
    if (sets.length) {
      valores.push(id);
      await client.query(
        `UPDATE horarios SET ${sets.join(', ')} WHERE id = $${valores.length}`,
        valores
      );
    }

    if (Array.isArray(detalles)) {
      for (const d of detalles) {
        await client.query(
          `INSERT INTO horario_detalle
             (horario_id, dia_semana, hora_entrada_manana, hora_salida_manana,
              hora_entrada_tarde, hora_salida_tarde)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (horario_id, dia_semana) DO UPDATE SET
             hora_entrada_manana = EXCLUDED.hora_entrada_manana,
             hora_salida_manana = EXCLUDED.hora_salida_manana,
             hora_entrada_tarde = EXCLUDED.hora_entrada_tarde,
             hora_salida_tarde = EXCLUDED.hora_salida_tarde`,
          [id, d.dia_semana, d.hora_entrada_manana ?? null, d.hora_salida_manana ?? null,
           d.hora_entrada_tarde ?? null, d.hora_salida_tarde ?? null]
        );
      }
    }

    await client.query('COMMIT');
    res.json({ mensaje: 'Horario actualizado correctamente' });
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch {}
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  } finally {
    client.release();
  }
};

exports.eliminar = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows: horario } = await pool.query('SELECT id FROM horarios WHERE id = $1', [id]);
    if (!horario.length) return res.status(404).json({ mensaje: 'Horario no encontrado' });

    const { rows: asignaciones } = await pool.query(
      'SELECT COUNT(*) AS total FROM asignaciones_horario WHERE horario_id = $1',
      [id]
    );
    if (Number(asignaciones[0].total) > 0) {
      return res.status(400).json({ mensaje: 'No se puede eliminar: el horario tiene empleados asignados' });
    }

    await pool.query('DELETE FROM horarios WHERE id = $1', [id]);
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
    const { rows: usuario } = await pool.query('SELECT id FROM usuarios WHERE id = $1', [usuario_id]);
    if (!usuario.length) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    const { rows: horario } = await pool.query('SELECT id FROM horarios WHERE id = $1', [horario_id]);
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
    return res.status(400).json({ mensaje: 'usuario_ids debe ser un arreglo de números' });
  }
  if (Array.isArray(usuario_ids) && usuario_ids.some((id) => !Number.isFinite(Number(id)))) {
    return res.status(400).json({ mensaje: 'usuario_ids debe contener solo números' });
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
    const { rows: horario } = await pool.query('SELECT id FROM horarios WHERE id = $1', [horario_id]);
    if (!horario.length) return res.status(404).json({ mensaje: 'Horario no encontrado' });

    let usuarios;
    if (Array.isArray(usuario_ids) && usuario_ids.length > 0) {
      // Lista explícita de usuarios (checkboxes de la UI), se filtran activos.
      const ids = usuario_ids.map((id) => Number(id));
      const { rows } = await pool.query(
        'SELECT id FROM usuarios WHERE id = ANY($1::int[]) AND activo = TRUE',
        [ids]
      );
      usuarios = rows;
    } else {
      // Comportamiento previo: asignar según filtros de área/cargo.
      const where = ['u.activo = TRUE'];
      const params = [];
      if (filtros.area_id != null) {
        where.push(`u.area_id = $${params.length + 1}`);
        params.push(filtros.area_id);
      }
      if (filtros.cargo_id != null) {
        where.push(`u.cargo_id = $${params.length + 1}`);
        params.push(filtros.cargo_id);
      }

      const { rows } = await pool.query(
        `SELECT u.id FROM usuarios u WHERE ${where.join(' AND ')}`,
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
    const { rows: usuario } = await pool.query('SELECT id FROM usuarios WHERE id = $1', [usuario_id]);
    if (!usuario.length) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `UPDATE asignaciones_horario SET vigencia_hasta = CURRENT_DATE
         WHERE usuario_id = $1 AND vigencia_hasta IS NULL`,
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
  const es_por_defecto = req.body.es_por_defecto === true;

  try {
    const { rows: horario } = await pool.query('SELECT id FROM horarios WHERE id = $1', [id]);
    if (!horario.length) return res.status(404).json({ mensaje: 'Horario no encontrado' });

    const { rows: cols } = await pool.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'horarios' AND column_name = 'es_por_defecto'`
    );
    if (!cols.length) {
      await pool.query(
        'ALTER TABLE horarios ADD COLUMN IF NOT EXISTS es_por_defecto BOOLEAN NOT NULL DEFAULT FALSE'
      );
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      if (es_por_defecto) {
        await client.query('UPDATE horarios SET es_por_defecto = FALSE WHERE es_por_defecto = TRUE');
        await client.query('UPDATE horarios SET es_por_defecto = TRUE WHERE id = $1', [id]);
      } else {
        await client.query('UPDATE horarios SET es_por_defecto = FALSE WHERE id = $1', [id]);
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
  try {
    const { rows: horario } = await pool.query('SELECT id FROM horarios WHERE id = $1', [id]);
    if (!horario.length) return res.status(404).json({ mensaje: 'Horario no encontrado' });

    const { rows: asignados } = await pool.query(`
      SELECT u.id, u.nombre AS nombres, u.apellido AS apellidos, u.correo
      FROM usuarios u
      JOIN asignaciones_horario a ON a.usuario_id = u.id
      WHERE a.horario_id = $1
        AND a.vigencia_desde <= CURRENT_DATE
        AND (a.vigencia_hasta IS NULL OR a.vigencia_hasta > CURRENT_DATE)
      ORDER BY u.nombre
    `, [id]);
    return res.json(asignados);
  } catch (err) {
    return res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
};

exports.miHorario = async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const { rows: usuarios } = await pool.query(
      'SELECT u.id, u.horario_id, u.nombre, u.apellido FROM usuarios u WHERE u.id = $1',
      [usuarioId]
    );
    if (!usuarios.length) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

    if (!usuarios[0].horario_id) {
      return res.json({ asignado: false, mensaje: 'No tienes horario asignado' });
    }

    const { rows: horarios } = await pool.query(`
      SELECT h.*, hd.dia_semana, hd.hora_entrada_manana, hd.hora_salida_manana,
        hd.hora_entrada_tarde, hd.hora_salida_tarde
      FROM horarios h
      LEFT JOIN horario_detalle hd ON h.id = hd.horario_id
      WHERE h.id = $1
      ORDER BY CASE hd.dia_semana WHEN 'Lunes' THEN 1 WHEN 'Martes' THEN 2 WHEN 'Miércoles' THEN 3 WHEN 'Jueves' THEN 4 WHEN 'Viernes' THEN 5 WHEN 'Sábado' THEN 6 WHEN 'Domingo' THEN 7 END
    `, [usuarios[0].horario_id]);

    if (!horarios.length) return res.status(404).json({ mensaje: 'Horario no encontrado' });

    const horario = {
      id: horarios[0].id, nombre: horarios[0].nombre,
      modalidad: horarios[0].modalidad, tipo_jornada: horarios[0].tipo_jornada,
      descripcion: horarios[0].descripcion, horas_esperadas: horarios[0].horas_esperadas,
      activo: horarios[0].activo,
      tolerancia_minutos: horarios[0].tolerancia_minutos,
      tolerancia_salida_minutos: horarios[0].tolerancia_salida_minutos,
      es_por_defecto: horarios[0].es_por_defecto,
      creado_en: horarios[0].creado_en,
      detalles: horarios.filter(r => r.dia_semana).map(r => ({
        dia_semana: r.dia_semana,
        hora_entrada_manana: r.hora_entrada_manana,
        hora_salida_manana: r.hora_salida_manana,
        hora_entrada_tarde: r.hora_entrada_tarde,
        hora_salida_tarde: r.hora_salida_tarde,
      }))
    };

    return res.json({ asignado: true, horario });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
};

exports.historial = async (req, res) => {
  const { usuarioId } = req.params;
  try {
    const { rows: asignaciones } = await pool.query(`
      SELECT a.*, h.nombre AS horario_nombre
      FROM asignaciones_horario a
      JOIN horarios h ON h.id = a.horario_id
      WHERE a.usuario_id = $1
      ORDER BY a.vigencia_desde DESC
    `, [usuarioId]);
    return res.json(asignaciones);
  } catch (err) {
    return res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
};

exports.historialGlobal = async (req, res) => {
  try {
    const { rows: asignaciones } = await pool.query(`
      WITH con_anterior AS (
        SELECT a.*,
          LAG(a.horario_id) OVER (PARTITION BY a.usuario_id ORDER BY a.vigencia_desde, a.id) AS horario_anterior_id
        FROM asignaciones_horario a
      )
      SELECT
        CONCAT(emp.nombre, ' ', emp.apellido) AS empleado,
        h.nombre AS horario_nuevo,
        hprev.nombre AS horario_anterior,
        ca.vigencia_desde AS fecha,
        CONCAT(adm.nombre, ' ', adm.apellido) AS usuario,
        ca.motivo
      FROM con_anterior ca
      JOIN usuarios emp ON emp.id = ca.usuario_id
      JOIN horarios h ON h.id = ca.horario_id
      LEFT JOIN horarios hprev ON hprev.id = ca.horario_anterior_id
      LEFT JOIN usuarios adm ON adm.id = ca.asignado_por
      ORDER BY ca.vigencia_desde DESC, ca.id DESC
    `);
    return res.json(asignaciones);
  } catch (err) {
    return res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
};
