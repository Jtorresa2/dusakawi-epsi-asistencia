const pool = require('../config/db');
const bcrypt = require('bcryptjs');

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
