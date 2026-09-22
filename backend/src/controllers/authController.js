const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("../config/db");

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ mensaje: "Faltan datos" });
    }

    const [rows] = await db.query(`
      SELECT
          u.id,
          u.username,
          u.password_hash,
          u.email,
          r.name AS rol,
          u.first_name,
          u.first_surname,
          u.area_id,
          u.position_id
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.username = ?
    `, [username]);

    if (rows.length === 0) {
      return res.status(401).json({ mensaje: "Usuario no existe" });
    }

    const user = rows[0];

    const passwordOk = await bcrypt.compare(password, user.password_hash);

    if (!passwordOk) {
      return res.status(401).json({ mensaje: "Contrasena incorrecta" });
    }

    const rolesMap = { "Administrador": "admin", "Talento Humano": "talento_humano", "Empleado": "empleado" };
    const fullName = `${user.first_name} ${user.first_surname || ''}`.trim();
    const token = jwt.sign(
      {
        id: user.id,
        empleado_id: user.id,
        username: user.username,
        nombre: fullName,
        rol: rolesMap[user.rol] || user.rol,
        roles: [user.rol || 'Empleado'],
      },
      process.env.JWT_SECRET || 'dusakawi_jwt_secret_2024',
      { expiresIn: "8h" }
    );

    res.json({
      token,
      password_reset_required: false,
      user: {
        id: user.id,
        empleado_id: user.id,
        username: user.username,
        nombre: fullName,
        email: user.email,
        rol: user.rol,
        area_id: user.area_id,
        cargo_id: user.position_id,
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({ mensaje: "Error en login", detalle: error.message });
  }
};

exports.cambiarPassword = async (req, res) => {
  try {
    const { password_actual, password_nuevo } = req.body;
    const usuarioId = req.user.id;

    if (!password_actual || !password_nuevo) {
      return res.status(400).json({ mensaje: "Faltan datos" });
    }

    if (password_nuevo.length < 8) {
      return res.status(400).json({ mensaje: "La contrasena debe tener al menos 8 caracteres" });
    }

    const [rows] = await db.query("SELECT password_hash FROM users WHERE id = ?", [usuarioId]);
    if (!rows.length) return res.status(404).json({ mensaje: "Usuario no encontrado" });

    const valida = await bcrypt.compare(password_actual, rows[0].password_hash);
    if (!valida) return res.status(400).json({ mensaje: "Contrasena actual incorrecta" });

    const hash = await bcrypt.hash(password_nuevo, 10);
    await db.query("UPDATE users SET password_hash = ? WHERE id = ?", [hash, usuarioId]);

    // Generar nuevo token
    const [userData] = await db.query(`
      SELECT u.id, u.username, r.name AS rol, u.first_name, u.first_surname
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.id = ?
    `, [usuarioId]);

    const user = userData[0] || {};
    const rolesMap = { "Administrador": "admin", "Talento Humano": "talento_humano", "Empleado": "empleado" };
    const fullName = `${user.first_name || ''} ${user.first_surname || ''}`.trim();
    const token = jwt.sign(
      {
        id: user.id,
        empleado_id: user.id,
        username: user.username,
        nombre: fullName,
        rol: rolesMap[user.rol] || user.rol,
        roles: [user.rol || 'Empleado'],
      },
      process.env.JWT_SECRET || 'dusakawi_jwt_secret_2024',
      { expiresIn: "8h" }
    );

    res.json({ mensaje: "Contrasena cambiada exitosamente", token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al cambiar contrasena" });
  }
};

exports.perfil = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
          u.id, u.username,
          CONCAT(u.first_name, ' ', u.first_surname) AS nombre,
          r.name AS rol
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.id = ?
    `, [req.user.id]);

    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error perfil" });
  }
};
