const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const { enviarCredenciales } = require('../services/emailService');

exports.getUsuarios = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        u.id, u.username, u.activo, u.password_reset_required, u.ultimo_acceso, u.creado_en,
        r.nombre AS rol,
        CONCAT(e.nombre, ' ', e.apellido) AS empleado,
        e.cedula, e.correo,
        a.nombre AS area,
        a.piso
      FROM usuarios u
      JOIN roles r ON u.rol_id = r.id
      JOIN empleado e ON u.empleado_id = e.id
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

    // Si no enviaron password, usar la cedula del empleado
    let passFinal = password;
    let cedula = null;
    if (!passFinal) {
      const [emp] = await pool.query('SELECT cedula, correo, nombre, apellido FROM empleado WHERE id = ?', [empleado_id]);
      if (!emp.length) return res.status(400).json({ mensaje: 'Empleado no encontrado' });
      cedula = emp[0].cedula;
      passFinal = cedula;
    }

    const hash = await bcrypt.hash(passFinal, 10);
    const [result] = await pool.query(
      `INSERT INTO usuarios (empleado_id, rol_id, username, password_hash, password_reset_required) VALUES (?, ?, ?, ?, 1)`,
      [empleado_id, rol_id, username, hash]
    );

    // Obtener datos del empleado para el email
    const [emp] = await pool.query('SELECT e.correo, e.nombre, e.apellido, e.cedula FROM empleado e WHERE e.id = ?', [empleado_id]);
    if (emp.length && emp[0].correo) {
      const link = process.env.FRONTEND_URL || 'http://localhost:3000';
      await enviarCredenciales({
        email: emp[0].correo,
        nombre: `${emp[0].nombre} ${emp[0].apellido}`,
        username,
        password: passFinal,
        link: `${link}/cambiar-password`,
      });
    }

    res.json({ mensaje: 'Usuario creado correctamente', password: passFinal, password_reset_required: 1 });
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
    // Empleados sin usuario
    const [sinUsuario] = await pool.query(`
      SELECT e.id, e.nombre, e.apellido, e.cedula, e.correo
      FROM empleado e
      LEFT JOIN usuarios u ON e.id = u.empleado_id
      WHERE u.id IS NULL
    `);

    if (!sinUsuario.length) return res.json({ mensaje: 'No hay empleados pendientes', creados: 0 });

    let creados = 0;
    let emailsOk = 0;
    let emailsFail = 0;
    const link = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resultados = [];

    for (const emp of sinUsuario) {
      // Generar username: nombre.apellido normalizado
      const username = emp.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '.') + '.' +
                       emp.apellido.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '.');
      // Evitar duplicados: agregar sufijo si existe
      let finalUser = username;
      let counter = 1;
      while (true) {
        const [dup] = await pool.query('SELECT id FROM usuarios WHERE username = ?', [finalUser]);
        if (!dup.length) break;
        finalUser = username + counter;
        counter++;
      }

      const hash = await bcrypt.hash(emp.cedula, 10);
      // Asignar rol por defecto: Empleado (id=3)
      await pool.query(
        `INSERT INTO usuarios (empleado_id, rol_id, username, password_hash, password_reset_required) VALUES (?, 3, ?, ?, 1)`,
        [emp.id, finalUser, hash]
      );
      creados++;

      if (emp.correo) {
        const r = await enviarCredenciales({
          email: emp.correo,
          nombre: `${emp.nombre} ${emp.apellido}`,
          username: finalUser,
          password: emp.cedula,
          link: `${link}/cambiar-password`,
        });
        if (r.enviado) emailsOk++; else emailsFail++;
      }

      resultados.push({ empleado: `${emp.nombre} ${emp.apellido}`, username: finalUser, password: emp.cedula, correo: emp.correo || 'SIN CORREO', email_enviado: !!(emp.correo && r?.enviado) });
    }

    res.json({
      mensaje: `${creados} usuarios creados`,
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
