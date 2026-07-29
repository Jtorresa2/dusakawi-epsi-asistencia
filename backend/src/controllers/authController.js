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
          u.empleado_id,
          u.activo,
          u.password_reset_required,
          r.nombre AS rol,
          e.nombre,
          e.apellido
      FROM usuarios u
      LEFT JOIN roles r ON u.rol_id = r.id
      LEFT JOIN empleado e ON u.empleado_id = e.id
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
    const token = jwt.sign(
      {
        id: user.id,
        empleado_id: user.empleado_id,
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
        empleado_id: user.empleado_id,
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
      SELECT u.id, u.username, u.empleado_id, r.nombre AS rol, e.nombre, e.apellido
      FROM usuarios u
      LEFT JOIN roles r ON u.rol_id = r.id
      LEFT JOIN empleado e ON u.empleado_id = e.id
      WHERE u.id = ?
    `, [usuarioId]);

    const rolesMap = { "Administrador": "admin", "Talento Humano": "talento_humano", "Empleado": "empleado" };
    const token = jwt.sign(
      {
        id: userData[0].id,
        empleado_id: userData[0].empleado_id,
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
          CONCAT(e.nombre,' ',e.apellido) AS nombre,
          r.nombre AS rol
      FROM usuarios u
      LEFT JOIN roles r ON u.rol_id = r.id
      LEFT JOIN empleado e ON u.empleado_id = e.id
      WHERE u.id = ?
    `, [req.user.id]);

    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error perfil" });
  }
};
