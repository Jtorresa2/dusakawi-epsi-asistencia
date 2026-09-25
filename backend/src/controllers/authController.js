const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const db = require("../config/db");
const { enviarResetPassword } = require("../services/emailService");

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

    const userRoles = rows.map(r => r.rol).filter(Boolean);
    const ALLOWED_ROLES = ["Administrador", "Talento Humano"];
    const authorizedRole = userRoles.find(r => ALLOWED_ROLES.includes(r));

    if (!authorizedRole) {
      return res.status(403).json({ mensaje: "Acceso denegado: su rol no tiene autorización para acceder al sistema" });
    }

    const rolesMap = { "Administrador": "admin", "Talento Humano": "talento_humano" };
    const fullName = `${user.first_name} ${user.first_surname || ''}`.trim();
    const token = jwt.sign(
      {
        id: user.id,
        empleado_id: user.id,
        username: user.username,
        nombre: fullName,
        rol: rolesMap[authorizedRole] || authorizedRole,
        roles: userRoles.filter(r => ALLOWED_ROLES.includes(r)),
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
        rol: authorizedRole,
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
    const rolesMap = { "Administrador": "admin", "Talento Humano": "talento_humano" };
    const fullName = `${user.first_name || ''} ${user.first_surname || ''}`.trim();
    const token = jwt.sign(
      {
        id: user.id,
        empleado_id: user.id,
        username: user.username,
        nombre: fullName,
        rol: rolesMap[user.rol] || user.rol,
        roles: user.rol ? [user.rol] : [],
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

exports.solicitarResetPassword = async (req, res) => {
  try {
    const { correo } = req.body;

    if (!correo) {
      return res.status(400).json({ mensaje: "Faltan datos" });
    }

    const mensajeGenerico = "Si el correo esta registrado, recibiras un enlace para restablecer tu contrasena";

    const [rows] = await db.query(
      "SELECT id, username, first_name, first_surname, email FROM users WHERE email = ?",
      [correo]
    );

    if (rows.length === 0) {
      return res.json({ mensaje: mensajeGenerico });
    }

    const usuario = rows[0];
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    await db.query(
      "UPDATE password_reset_tokens SET used = true WHERE user_id = ? AND used = false",
      [usuario.id]
    );
    await db.query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
       VALUES (?, ?, now() + interval '30 minutes')`,
      [usuario.id, tokenHash]
    );

    const link = `${process.env.FRONTEND_URL || "http://localhost:3000"}/restablecer-contrasena?token=${token}`;
    await enviarResetPassword({
      email: usuario.email,
      nombre: `${usuario.first_name} ${usuario.first_surname}`,
      link,
    });

    res.json({ mensaje: mensajeGenerico });
  } catch (error) {
    console.error("SOLICITAR RESET ERROR:", error);
    res.status(500).json({ mensaje: "Error al solicitar restablecimiento de contrasena" });
  }
};

exports.restablecerPassword = async (req, res) => {
  try {
    const { token, password_nuevo } = req.body;

    if (!token || !password_nuevo) {
      return res.status(400).json({ mensaje: "Faltan datos" });
    }

    if (password_nuevo.length < 8) {
      return res.status(400).json({ mensaje: "La contrasena debe tener al menos 8 caracteres" });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const [rows] = await db.query(
      `SELECT t.id, t.user_id, t.expires_at, t.used
       FROM password_reset_tokens t
       WHERE t.token_hash = ?`,
      [tokenHash]
    );

    if (rows.length === 0 || rows[0].used) {
      return res.status(400).json({ mensaje: "Enlace invalido o ya utilizado" });
    }

    if (new Date(rows[0].expires_at) < new Date()) {
      return res.status(400).json({ mensaje: "El enlace ha expirado" });
    }

    const hash = await bcrypt.hash(password_nuevo, 10);
    await db.query(
      "UPDATE users SET password_hash = ?, password_reset_required = false WHERE id = ?",
      [hash, rows[0].user_id]
    );
    await db.query("UPDATE password_reset_tokens SET used = true, used_at = now() WHERE id = ?", [rows[0].id]);

    res.json({ mensaje: "Contrasena restablecida exitosamente" });
  } catch (error) {
    console.error("RESTABLECER RESET ERROR:", error);
    res.status(500).json({ mensaje: "Error al restablecer contrasena" });
  }
};

exports.validarTokenReset = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.json({ valido: false, motivo: "invalido" });
    const tokenHash = crypto.createHash("sha256").update(String(token)).digest("hex");
    const [rows] = await db.query(
      `SELECT id, used, expires_at
       FROM password_reset_tokens
       WHERE token_hash = ?`,
      [tokenHash]
    );
    if (rows.length === 0) return res.json({ valido: false, motivo: "invalido" });
    if (rows[0].used) return res.json({ valido: false, motivo: "usado" });
    if (new Date(rows[0].expires_at) < new Date()) return res.json({ valido: false, motivo: "expirado" });
    res.json({ valido: true });
  } catch (error) {
    console.error("VALIDAR TOKEN RESET ERROR:", error);
    res.status(500).json({ mensaje: "Error al validar el enlace" });
  }
};

exports.misPermisos = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT DISTINCT a.name
      FROM user_roles ur
      JOIN role_actions ra ON ra.role_id = ur.role_id
      JOIN actions a ON a.id = ra.action_id
      WHERE ur.user_id = ?
      ORDER BY a.name
    `, [req.user.id]);
    res.json({ permissions: rows.map((r) => r.name) });
  } catch (error) {
    console.error("MIS PERMISOS ERROR:", error);
    res.status(500).json({ mensaje: "Error al obtener permisos" });
  }
};
