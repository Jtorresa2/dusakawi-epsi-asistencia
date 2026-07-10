const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const db = require("../config/db");

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        mensaje: "Faltan datos",
      });
    }

    const [rows] = await db.query(
      `
      SELECT
          u.id,
          u.username,
          u.password_hash,
          u.empleado_id,
          r.nombre AS rol,
          e.nombre,
          e.apellido
      FROM usuarios u
      LEFT JOIN roles r
          ON u.rol_id = r.id
      LEFT JOIN empleado e
          ON u.empleado_id = e.id
      WHERE u.username = ?
      `,
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        mensaje: "Usuario no existe",
      });
    }

    const user = rows[0];

    const passwordOk = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordOk) {
      return res.status(401).json({
        mensaje: "Contraseña incorrecta",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        empleado_id: user.empleado_id,
        username: user.username,
        nombre: `${user.nombre} ${user.apellido}`,
        rol: user.rol,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "8h",
      }
    );

    res.json({
      token,
      user: {
        id: user.id,
        empleado_id: user.empleado_id,
        username: user.username,
        nombre: `${user.nombre} ${user.apellido}`,
        rol: user.rol,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: "Error en login",
    });
  }
};

exports.perfil = async (req, res) => {
  try {
    const [rows] = await db.query(
      `
      SELECT
          u.id,
          u.username,
          CONCAT(e.nombre,' ',e.apellido) AS nombre,
          r.nombre AS rol
      FROM usuarios u
      LEFT JOIN roles r
          ON u.rol_id = r.id
      LEFT JOIN empleado e
          ON u.empleado_id = e.id
      WHERE u.id = ?
      `,
      [req.user.id]
    );

    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: "Error perfil",
    });
  }
};
