const pool = require('../config/db');
const bcrypt = require('bcryptjs');

exports.getUsuarios = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        u.id, u.username, u.activo, u.ultimo_acceso, u.creado_en,
        r.nombre AS rol,
        CONCAT(e.nombre, ' ', e.apellido) AS empleado,
        e.cedula, e.correo,
        a.nombre AS area,
        a.piso
      FROM usuarios u
      JOIN roles r ON u.rol_id = r.id
      JOIN empleados e ON u.empleado_id = e.id
      JOIN areas a ON e.area_id = a.id
      ORDER BY u.creado_en DESC
    `);
    res.json({ usuarios: rows });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
};

exports.crearUsuario = async (req, res) => {
  try {
    const { empleado_id, rol_id, username, password } = req.body;
    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      `INSERT INTO usuarios (empleado_id, rol_id, username, password_hash) VALUES (?, ?, ?, ?)`,
      [empleado_id, rol_id, username, hash]
    );
    res.json({ mensaje: 'Usuario creado correctamente' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ mensaje: 'El usuario ya existe' });
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
};

exports.actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { rol_id, username, password, activo } = req.body;
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      await pool.query(`UPDATE usuarios SET rol_id=?, username=?, password_hash=?, activo=? WHERE id=?`, [rol_id, username, hash, activo, id]);
    } else {
      await pool.query(`UPDATE usuarios SET rol_id=?, username=?, activo=? WHERE id=?`, [rol_id, username, activo, id]);
    }
    res.json({ mensaje: 'Usuario actualizado correctamente' });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
};

exports.eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(`DELETE FROM usuarios WHERE id = ?`, [id]);
    res.json({ mensaje: 'Usuario eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
};

exports.getRoles = async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT id, nombre, descripcion FROM roles`);
    res.json({ roles: rows });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
};