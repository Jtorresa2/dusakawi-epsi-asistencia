const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const db = require("../config/db");
const { enviarResetPassword, enviarCredenciales } = require("../services/emailService");

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ mensaje: "Faltan datos" });
    }

    const { rows } = await db.query(`
      SELECT
          u.id,
          u.username,
          u.password_hash,
          u.activo,
          u.password_reset_required,
          r.nombre AS rol,
          u.nombre,
          u.apellido,
          u.correo
      FROM usuarios u
      LEFT JOIN roles r ON u.rol_id = r.id
      WHERE u.username = $1
    `, [username]);

    if (rows.length === 0) {
      return res.status(401).json({ mensaje: "Usuario no existe" });
    }

    const user = rows[0];

    if (!user.activo) {
      return res.status(403).json({ mensaje: "Usuario desactivado. Contacta al administrador" });
    }

    const passwordOk = await bcrypt.compare(password, user.password_hash);

    if (!passwordOk) {
      return res.status(401).json({ mensaje: "Contrasena incorrecta" });
    }

    const rolesMap = { "Administrador": "admin", "Talento Humano": "talento_humano", "Empleado": "empleado" };

    // Forced password reset: the user MUST change their password before
    // accessing the system. Generate a reset token, send it via email,
    // and return a message only — NO JWT is issued.
    if (user.password_reset_required) {
      // The user already proved their identity with the correct password.
      // If there is no email on file, the only exit is a manual reset by
      // an administrator — tell them clearly.
      if (!user.correo || !String(user.correo).trim()) {
        return res.status(403).json({
          mensaje: "Tu cuenta requiere cambiar la contrasena, pero no tienes un correo asociado. Contacta al administrador para obtener acceso.",
          password_reset_required: true,
        });
      }

      const resetToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");

      // Invalidate any previous reset tokens for this user
      await db.query(
        "UPDATE password_reset_tokens SET usado = true WHERE usuario_id = $1 AND usado = false",
        [user.id]
      );

      // Store the new reset token (expires in 30 minutes)
      await db.query(
        `INSERT INTO password_reset_tokens (usuario_id, token_hash, expira_en)
         VALUES ($1, $2, now() + interval '30 minutes')`,
        [user.id, tokenHash]
      );

      // Send email with the reset link
      const link = `${process.env.FRONTEND_URL || "http://localhost:3000"}/restablecer-contrasena?token=${resetToken}`;
      await enviarResetPassword({
        email: user.correo,
        nombre: `${user.nombre} ${user.apellido}`,
        username: user.username,
        link,
        primerIngreso: true,
      });

      // Return a generic message — do NOT reveal whether the email was sent
      return res.status(403).json({
        mensaje: "Se envio un enlace de restablecimiento a tu correo electronico. Debes cambiar tu contrasena antes de acceder al sistema.",
        password_reset_required: true,
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        nombre: `${user.nombre} ${user.apellido}`,
        rol: rolesMap[user.rol] || user.rol,
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    // Actualizar ultimo_acceso
    await db.query("UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = $1", [user.id]);

    res.json({
      token,
      password_reset_required: !!user.password_reset_required,
      user: {
        id: user.id,
        username: user.username,
        nombre: `${user.nombre} ${user.apellido}`,
        rol: user.rol,
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    console.error("STACK:", error.stack);
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

    const { rows } = await db.query("SELECT password_hash FROM usuarios WHERE id = $1", [usuarioId]);
    if (!rows.length) return res.status(404).json({ mensaje: "Usuario no encontrado" });

    const valida = await bcrypt.compare(password_actual, rows[0].password_hash);
    if (!valida) return res.status(400).json({ mensaje: "Contrasena actual incorrecta" });

    const hash = await bcrypt.hash(password_nuevo, 10);
    await db.query("UPDATE usuarios SET password_hash = $1, password_reset_required = false WHERE id = $2", [hash, usuarioId]);

    // Generar nuevo token
    const { rows: userData } = await db.query(`
      SELECT u.id, u.username, r.nombre AS rol, u.nombre, u.apellido
      FROM usuarios u
      LEFT JOIN roles r ON u.rol_id = r.id
      WHERE u.id = $1
    `, [usuarioId]);

    const rolesMap = { "Administrador": "admin", "Talento Humano": "talento_humano", "Empleado": "empleado" };
    const token = jwt.sign(
      {
        id: userData[0].id,
        username: userData[0].username,
        nombre: `${userData[0].nombre} ${userData[0].apellido}`,
        rol: rolesMap[userData[0].rol] || userData[0].rol,
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({ mensaje: "Contrasena cambiada exitosamente", token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al cambiar contrasena" });
  }
};

exports.solicitarResetPassword = async (req, res) => {
  try {
    const { correo } = req.body;

    if (!correo) {
      return res.status(400).json({ mensaje: "Faltan datos" });
    }

    const mensajeGenerico = "Si el correo esta registrado, recibiras un enlace para restablecer tu contrasena";

    const { rows } = await db.query(
      "SELECT id, username, nombre, apellido, correo FROM usuarios WHERE correo = $1",
      [correo]
    );

    // Anti-enumeracion: mismo mensaje (y mismo codigo 200) si el correo no existe.
    if (rows.length === 0) {
      return res.json({ mensaje: mensajeGenerico });
    }

    const usuario = rows[0];
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // Invalida tokens previos del usuario antes de emitir uno nuevo.
    await db.query(
      "UPDATE password_reset_tokens SET usado = true WHERE usuario_id = $1 AND usado = false",
      [usuario.id]
    );
    await db.query(
      `INSERT INTO password_reset_tokens (usuario_id, token_hash, expira_en)
       VALUES ($1, $2, now() + interval '30 minutes')`,
      [usuario.id, tokenHash]
    );

    const link = `${process.env.FRONTEND_URL || "http://localhost:3000"}/restablecer-contrasena?token=${token}`;
    await enviarResetPassword({
      email: usuario.correo,
      nombre: `${usuario.nombre} ${usuario.apellido}`,
      link,
    });

    // Nunca se devuelve el token en la respuesta HTTP.
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

    const { rows } = await db.query(
      `SELECT t.id, t.usuario_id, t.expira_en, t.usado
       FROM password_reset_tokens t
       WHERE t.token_hash = $1`,
      [tokenHash]
    );

    if (rows.length === 0 || rows[0].usado) {
      return res.status(400).json({ mensaje: "Enlace invalido o ya utilizado" });
    }

    if (new Date(rows[0].expira_en) < new Date()) {
      return res.status(400).json({ mensaje: "El enlace ha expirado" });
    }

    const hash = await bcrypt.hash(password_nuevo, 10);
    await db.query(
      "UPDATE usuarios SET password_hash = $1, password_reset_required = false WHERE id = $2",
      [hash, rows[0].usuario_id]
    );
    await db.query("UPDATE password_reset_tokens SET usado = true WHERE id = $1", [rows[0].id]);

    res.json({ mensaje: "Contrasena restablecida exitosamente" });
  } catch (error) {
    console.error("RESTABLECER RESET ERROR:", error);
    res.status(500).json({ mensaje: "Error al restablecer contrasena" });
  }
};

exports.perfil = async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT
          u.id, u.username, u.password_reset_required,
          CONCAT(u.nombre,' ',u.apellido) AS nombre,
          r.nombre AS rol
      FROM usuarios u
      LEFT JOIN roles r ON u.rol_id = r.id
      WHERE u.id = $1
    `, [req.user.id]);

    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error perfil" });
  }
};
