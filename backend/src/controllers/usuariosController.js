const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const { enviarCredenciales } = require('../services/emailService');
const personalService = require('../services/personalService');

exports.getUsuarios = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        u.id, u.username, u.activo, u.password_reset_required, u.ultimo_acceso, u.creado_en,
        r.nombre AS rol,
        CONCAT(u.nombre, ' ', u.apellido) AS empleado,
        u.cedula, u.correo,
        a.nombre AS area,
        a.piso
      FROM usuarios u
      JOIN roles r ON u.rol_id = r.id
      LEFT JOIN areas a ON u.area_id = a.id
      ORDER BY u.creado_en DESC
    `);
    res.json({ usuarios: rows });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
};

exports.crearUsuario = async (req, res) => {
  try {
    const { cedula, nombre, apellido, correo, rol_id, username, password } = req.body;

    // Use personalService to create the user with all fields
    const result = await personalService.crear({
      cedula,
      nombre,
      apellido,
      correo: correo || req.body.correo,
      telefono: req.body.telefono || null,
      fecha_nacimiento: req.body.fecha_nacimiento || null,
      cargo_id: req.body.cargo_id || null,
      area_id: req.body.area_id || null,
      piso: req.body.piso ?? null,
      horario_id: req.body.horario_id || null,
      activo: req.body.activo !== undefined ? req.body.activo : 1,
      rol_id,
      username,
      password,
    });

    // Send credentials email if correo is provided
    const correoFinal = correo || req.body.correo;
    if (correoFinal) {
      const link = process.env.FRONTEND_URL || 'http://localhost:3000';
      await enviarCredenciales({
        email: correoFinal,
        nombre: `${nombre} ${apellido}`,
        username: result.username,
        password: result.password,
        link: `${link}/cambiar-password`,
      });
    }

    res.json({
      mensaje: 'Usuario creado correctamente',
      password: result.password,
      password_reset_required: 1,
    });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ mensaje: 'El usuario ya existe' });
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
};

exports.actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { rol_id, username, password, activo, password_reset_required } = req.body;
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      await pool.query(`UPDATE usuarios SET rol_id=?, username=?, password_hash=?, activo=?, password_reset_required=? WHERE id=?`, [rol_id, username, hash, activo, password_reset_required ?? 0, id]);
    } else {
      await pool.query(`UPDATE usuarios SET rol_id=?, username=?, activo=?, password_reset_required=? WHERE id=?`, [rol_id, username, activo, password_reset_required ?? 0, id]);
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

exports.generarMasivos = async (req, res) => {
  try {
    // After the merge, all personal data lives in usuarios.
    // There are no separate empleado records without a linked usuario.
    // Check for any usuarios with missing personal data fields.
    const [incompletos] = await pool.query(`
      SELECT id, nombre, apellido, cedula, correo
      FROM usuarios
      WHERE cedula IS NULL OR correo IS NULL
    `);

    if (!incompletos.length) {
      return res.json({ mensaje: 'No hay usuarios pendientes — todos los datos están completos', creados: 0 });
    }

    let creados = 0;
    let emailsOk = 0;
    let emailsFail = 0;
    const link = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resultados = [];

    for (const user of incompletos) {
      const username = generarUsernameDesde(user.nombre, user.apellido);
      let finalUser = username;
      let counter = 1;
      while (true) {
        const [dup] = await pool.query('SELECT id FROM usuarios WHERE username = ?', [finalUser]);
        if (!dup.length) break;
        finalUser = username + counter;
        counter++;
      }

      const pass = user.cedula || `${user.nombre.toLowerCase()}.${user.apellido.toLowerCase()}`;
      const hash = await bcrypt.hash(pass, 10);
      await pool.query(
        `UPDATE usuarios SET username = ?, password_hash = ?, password_reset_required = 1 WHERE id = ?`,
        [finalUser, hash, user.id]
      );
      creados++;

      if (user.correo) {
        const r = await enviarCredenciales({
          email: user.correo,
          nombre: `${user.nombre} ${user.apellido}`,
          username: finalUser,
          password: pass,
          link: `${link}/cambiar-password`,
        });
        if (r.enviado) emailsOk++; else emailsFail++;
      }

      resultados.push({
        empleado: `${user.nombre} ${user.apellido}`,
        username: finalUser,
        password: pass,
        correo: user.correo || 'SIN CORREO',
        email_enviado: !!(user.correo && r?.enviado),
      });
    }

    res.json({
      mensaje: `${creados} usuarios actualizados`,
      creados,
      emails_enviados: emailsOk,
      emails_fallados: emailsFail,
      resultados,
    });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
};

exports.getRoles = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, nombre, descripcion FROM roles');
    res.json({ roles: rows });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
};

// Helper
function generarUsernameDesde(nombre, apellido) {
  return nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '.') + '.' +
         apellido.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '.');
}
