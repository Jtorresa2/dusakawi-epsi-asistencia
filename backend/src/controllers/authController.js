const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
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
          u.activo,
          u.password_reset_required,
          r.nombre AS rol,
          u.nombre,
          u.apellido
      FROM usuarios u
      LEFT JOIN roles r ON u.rol_id = r.id
      WHERE u.username = ?
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

    // Forced password reset: refuse a normal session (403) but still issue a
    // token so the frontend can authenticate against /auth/cambiar-password.
    // Placed AFTER the password check on purpose: no token is ever issued
    // without proof of the credentials, and the reset-required status is not
    // leaked through a distinct pre-auth response code.
    if (user.password_reset_required) {
      const resetToken = jwt.sign(
        {
          id: user.id,
          username: user.username,
          nombre: `${user.nombre} ${user.apellido}`,
          rol: rolesMap[user.rol] || user.rol,
        },
        process.env.JWT_SECRET,
        { expiresIn: "8h" }
      );
      return res.status(403).json({
        mensaje: "Debe cambiar su contrasena antes de continuar",
        password_reset_required: true,
        token: resetToken,
        user: {
          id: user.id,
          username: user.username,
          nombre: `${user.nombre} ${user.apellido}`,
          rol: user.rol,
        },
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
    await db.query("UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = ?", [user.id]);

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

    const [rows] = await db.query("SELECT password_hash FROM usuarios WHERE id = ?", [usuarioId]);
    if (!rows.length) return res.status(404).json({ mensaje: "Usuario no encontrado" });

    const valida = await bcrypt.compare(password_actual, rows[0].password_hash);
    if (!valida) return res.status(400).json({ mensaje: "Contrasena actual incorrecta" });

    const hash = await bcrypt.hash(password_nuevo, 10);
    await db.query("UPDATE usuarios SET password_hash = ?, password_reset_required = 0 WHERE id = ?", [hash, usuarioId]);

    // Generar nuevo token
    const [userData] = await db.query(`
      SELECT u.id, u.username, r.nombre AS rol, u.nombre, u.apellido
      FROM usuarios u
      LEFT JOIN roles r ON u.rol_id = r.id
      WHERE u.id = ?
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

exports.perfil = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
          u.id, u.username, u.password_reset_required,
          CONCAT(u.nombre,' ',u.apellido) AS nombre,
          r.nombre AS rol
      FROM usuarios u
      LEFT JOIN roles r ON u.rol_id = r.id
      WHERE u.id = ?
    `, [req.user.id]);

    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error perfil" });
  }
};
