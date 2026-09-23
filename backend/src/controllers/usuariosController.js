const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { enviarResetPassword } = require('../services/emailService');

exports.getUsuarios = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        u.id,
        u.id AS empleado_id,
        u.username,
        1 AS activo,
        0 AS password_reset_required,
        u.created_at AS creado_en,
        u.created_at AS ultimo_acceso,
        COALESCE(r.name, 'Empleado') AS rol,
        COALESCE(r.id, '86b7792a-7786-4a15-91e3-ebdeec841992') AS rol_id,
        TRIM(CONCAT(u.first_name, ' ', u.first_surname)) AS empleado,
        COALESCE(dd.document_number, '') AS cedula,
        u.email AS correo,
        COALESCE(a.name, '') AS area,
        COALESCE(fl.name, '') AS piso
      FROM users u
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      LEFT JOIN roles r ON ur.role_id = r.id
      LEFT JOIN document_details dd ON dd.user_id = u.id
      LEFT JOIN areas a ON u.area_id = a.id
      LEFT JOIN floors fl ON a.floor_id = fl.id
      ORDER BY u.created_at DESC
    `);
    res.json({ usuarios: rows });
  } catch (err) {
    console.error('getUsuarios error:', err);
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
};

exports.crearUsuario = async (req, res) => {
  try {
    const { empleado_id, rol_id, username, password } = req.body;

    const [emp] = await pool.query(`
      SELECT u.id, u.email, u.first_name, u.first_surname, dd.document_number AS cedula
      FROM users u
      LEFT JOIN document_details dd ON dd.user_id = u.id
      WHERE u.id = ?
    `, [empleado_id]);

    if (!emp.length) return res.status(400).json({ mensaje: 'Empleado no encontrado' });

    let passFinal = password || emp[0].cedula || '123456';
    const hash = await bcrypt.hash(passFinal, 10);

    await pool.query(
      `UPDATE users SET username = ?, password_hash = ? WHERE id = ?`,
      [username, hash, empleado_id]
    );

    if (rol_id) {
      await pool.query(`DELETE FROM user_roles WHERE user_id = ?`, [empleado_id]);
      await pool.query(`INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)`, [empleado_id, rol_id]);
    }

    res.json({ mensaje: 'Usuario creado correctamente', password: passFinal, password_reset_required: 0 });
  } catch (err) {
    console.error('crearUsuario error:', err);
    if (err.code === '23505') return res.status(400).json({ mensaje: 'El nombre de usuario ya existe' });
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
};

exports.actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { rol_id, username, password } = req.body;

    if (password && password.trim() !== '') {
      const hash = await bcrypt.hash(password, 10);
      if (username) {
        await pool.query(`UPDATE users SET username = ?, password_hash = ? WHERE id = ?`, [username, hash, id]);
      } else {
        await pool.query(`UPDATE users SET password_hash = ? WHERE id = ?`, [hash, id]);
      }
    } else if (username) {
      await pool.query(`UPDATE users SET username = ? WHERE id = ?`, [username, id]);
    }

    if (rol_id) {
      await pool.query(`DELETE FROM user_roles WHERE user_id = ?`, [id]);
      await pool.query(`INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)`, [id, rol_id]);
    }

    res.json({ mensaje: 'Usuario actualizado correctamente' });
  } catch (err) {
    console.error('actualizarUsuario error:', err);
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
};

exports.eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(`DELETE FROM user_roles WHERE user_id = ?`, [id]);
    res.json({ mensaje: 'Usuario eliminado correctamente' });
  } catch (err) {
    console.error('eliminarUsuario error:', err);
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
};

exports.generarMasivos = async (req, res) => {
  try {
    const [pendientes] = await pool.query(`
      SELECT u.id, u.first_name, u.first_surname, COALESCE(dd.document_number, '123456') AS cedula, u.email
      FROM users u
      LEFT JOIN document_details dd ON dd.user_id = u.id
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      WHERE ur.role_id IS NULL
    `);

    const [roleEmp] = await pool.query(`SELECT id FROM roles WHERE name ILIKE '%empleado%' LIMIT 1`);
    const defaultRoleId = roleEmp[0]?.id || '86b7792a-7786-4a15-91e3-ebdeec841992';

    let creados = 0;
    const resultados = [];
    for (const emp of pendientes) {
      const baseUser = `${emp.first_name}.${emp.first_surname}`.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '.');
      const hash = await bcrypt.hash(emp.cedula, 10);
      await pool.query(`UPDATE users SET username = ?, password_hash = ? WHERE id = ?`, [baseUser, hash, emp.id]);
      await pool.query(`INSERT INTO user_roles (user_id, role_id) VALUES (?, ?) ON CONFLICT DO NOTHING`, [emp.id, defaultRoleId]);
      creados++;
      resultados.push({ empleado: `${emp.first_name} ${emp.first_surname}`, username: baseUser, password: emp.cedula, correo: emp.email });
    }

    res.json({
      mensaje: `${creados} usuarios generados`,
      creados,
      emails_enviados: 0,
      emails_fallados: 0,
      resultados,
    });
  } catch (err) {
    console.error('generarMasivos error:', err);
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
};

exports.getRoles = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name AS nombre, description AS descripcion FROM roles ORDER BY name');
    res.json({ roles: rows });
  } catch (err) {
    console.error('getRoles error:', err);
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
};

// ========================================================
// Roles: permisos (port desde refactor/architecture)
// ========================================================

function esIdValido(value) {
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuid.test(value) || /^\d+$/.test(value);
}

exports.getPermisosRol = async (req, res) => {
  try {
    const { id } = req.params;
    if (!esIdValido(String(id))) {
      return res.status(400).json({ mensaje: 'Id inválido' });
    }
    const [rol] = await pool.query('SELECT id FROM roles WHERE id = ?', [id]);
    if (!rol.length) return res.status(404).json({ mensaje: 'Rol no encontrado' });

    const [rows] = await pool.query(
      `SELECT acc.name
       FROM actions acc
       JOIN role_actions ra ON ra.action_id = acc.id
       WHERE ra.role_id = ?`,
      [id]
    );
    res.json({ permissions: rows.map((r) => r.name) });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
};

exports.updateRol = async (req, res) => {
  const { id } = req.params;
  if (!esIdValido(String(id))) {
    return res.status(400).json({ mensaje: 'Id inválido' });
  }
  const { descripcion, permisos } = req.body;

  const acciones = Array.isArray(permisos) ? permisos : [];

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: rol } = await client.query('SELECT id FROM roles WHERE id = $1', [id]);
    if (!rol.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ mensaje: 'Rol no encontrado' });
    }

    if (descripcion !== undefined) {
      await client.query('UPDATE roles SET description = $1 WHERE id = $2', [descripcion, id]);
    }

    await client.query('DELETE FROM role_actions WHERE role_id = $1', [id]);

    if (acciones.length) {
      await client.query(
        `INSERT INTO role_actions (role_id, action_id)
         SELECT $1, acc.id FROM actions acc WHERE acc.name = ANY($2::text[])`,
        [id, acciones]
      );
    }

    await client.query('COMMIT');
    res.json({ mensaje: 'Rol actualizado correctamente' });
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch {}
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  } finally {
    client.release();
  }
};

// ========================================================
// Usuarios: pendientes de correo de acceso (port refactor)
// ========================================================

exports.getPendientesEmail = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT u.id,
             CONCAT(u.first_name, ' ', u.first_surname) AS nombre,
             u.username,
             u.email,
             u.password_reset_required,
             r.name AS rol,
             t.ultimo_envio,
             t.expira,
             t.aceptado_en,
             CASE
               WHEN u.password_reset_required = FALSE THEN 'aceptado'
               WHEN t.ultimo_envio IS NULL THEN 'sin_enviar'
               WHEN t.expira IS NULL OR t.expira > now() THEN 'enviado'
               ELSE 'expirado'
             END AS estado
      FROM users u
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      LEFT JOIN roles r ON r.id = ur.role_id
      LEFT JOIN LATERAL (
        SELECT pt.created_at AS ultimo_envio,
               pt.expires_at AS expira,
               CASE WHEN pt.used THEN pt.used_at ELSE NULL END AS aceptado_en
        FROM password_reset_tokens pt
        WHERE pt.user_id = u.id
        ORDER BY pt.created_at DESC
        LIMIT 1
      ) t ON TRUE
      WHERE u.active = TRUE
        AND u.email IS NOT NULL AND u.email <> ''
        AND (u.password_reset_required = TRUE OR t.ultimo_envio IS NOT NULL)
      ORDER BY u.password_reset_required DESC, u.first_name, u.first_surname
    `);
    res.json({ pendientes: rows });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
};

function generarUsername(nombre, apellido, cedula) {
  const normalizar = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
  const primeraPalabra = (s) => String(s || '').trim().split(/\s+/)[0] || '';
  const inicial = (normalizar(primeraPalabra(nombre)) || 'u').charAt(0);
  const apellidoNorm = normalizar(apellido || '');
  const primerApellido = (apellidoNorm.split(' ') [0] || '').substring(0, 8);
  const sufijo = String(cedula || '').slice(-3);
  return `${inicial}${primerApellido}${sufijo}`;
}

exports.enviarEmailAcceso = async (req, res) => {
  try {
    const { userIds, todos } = req.body;

    let targets = [];

    if (todos) {
      const [rows] = await pool.query(`
        SELECT u.id
        FROM users u
        WHERE u.active = TRUE
          AND u.email IS NOT NULL AND u.email <> ''
          AND u.password_reset_required = TRUE
      `);
      targets = rows;
    } else if (Array.isArray(userIds) && userIds.length) {
      targets = userIds.map((id) => ({ id }));
    } else {
      return res.status(400).json({ mensaje: 'Indique usuarios o use todos' });
    }

    const link = process.env.FRONTEND_URL || 'http://localhost:3000';
    let enviados = 0;
    let fallidos = 0;
    let sin_correo = 0;
    const resultados = [];

    for (const t of targets) {
      const [rows] = await pool.query(
        `SELECT id, first_name, first_surname, username, password_hash, email
         FROM users WHERE id = ?`,
        [t.id]
      );
      const user = rows[0];
      if (!user) {
        fallidos++;
        resultados.push({ id: t.id, nombre: '?', username: '?', email: '?', enviado: false, motivo: 'NO ENCONTRADO' });
        continue;
      }

      if (!user.email || !user.email.trim()) {
        sin_correo++;
        resultados.push({
          id: user.id,
          nombre: `${user.first_name} ${user.first_surname}`,
          username: user.username,
          email: 'SIN CORREO',
          enviado: false,
          motivo: 'SIN CORREO'
        });
        continue;
      }

      let finalUsername = user.username;
      let finalPassword = null;

      if (!finalUsername || !finalUsername.trim()) {
        const [ddRows] = await pool.query(
          'SELECT document_number FROM document_details WHERE user_id = ?',
          [user.id]
        );
        finalUsername = generarUsername(user.first_name, user.first_surname, ddRows[0]?.document_number);
        let counter = 1;
        while (true) {
          const [dup] = await pool.query('SELECT id FROM users WHERE username = ?', [finalUsername]);
          if (!dup.length) break;
          finalUsername = `${finalUsername}${counter++}`;
        }
      }

      if (!user.password_hash) {
        finalPassword = crypto.randomBytes(32).toString('hex');
        const hash = await bcrypt.hash(finalPassword, 10);
        await pool.query(
          `UPDATE users SET username = ?, password_hash = ?, password_reset_required = TRUE WHERE id = ?`,
          [finalUsername, hash, user.id]
        );
      } else if (finalUsername !== user.username) {
        await pool.query(
          `UPDATE users SET username = ? WHERE id = ?`,
          [finalUsername, user.id]
        );
      }

      await pool.query(
        `UPDATE password_reset_tokens SET used = true WHERE user_id = ? AND used = false`,
        [user.id]
      );

      const resetToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
      await pool.query(
        `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
         VALUES (?, ?, now() + interval '7 days')`,
        [user.id, tokenHash]
      );

      let r = null;
      try {
        r = await enviarResetPassword({
          email: user.email,
          nombre: `${user.first_name} ${user.first_surname}`,
          username: finalUsername,
          link: `${link}/restablecer-contrasena?token=${resetToken}`,
          primerIngreso: true
        });
      } catch {}

      if (r && r.enviado === true) {
        enviados++;
      } else {
        fallidos++;
      }

      resultados.push({
        id: user.id,
        nombre: `${user.first_name} ${user.first_surname}`,
        username: finalUsername,
        email: user.email,
        enviado: !!(r && r.enviado === true),
        motivo: !(r && r.enviado === true) ? (r?.motivo || 'ENVIO FALLIDO') : undefined
      });
    }

    res.json({ enviados, fallidos, sin_correo, resultados });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
};
