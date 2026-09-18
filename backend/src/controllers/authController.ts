import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
import pool from "../config/db";
import { enviarResetPassword } from "../services/emailService";
import { Request, Response } from "express";
import { getErrorMessage } from "../utils/errors";

// Rol name -> short code stored in the JWT. Must stay in sync with the roles
// seed data ("Administrador" | "Talento Humano" | "Empleado").
const ROLES_MAP: Record<string, string> = {
  Administrador: "admin",
  "Talento Humano": "talento_humano",
  Empleado: "empleado",
};

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ mensaje: "Faltan datos" });
    }

    const { rows } = await pool.query(`
      SELECT
          u.id,
          u.username,
          u.password_hash,
          u.active,
          u.password_reset_required,
          r.name AS role,
          u.first_name,
          u.first_surname,
          u.email
      FROM users u
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      LEFT JOIN roles r ON r.id = ur.role_id
      WHERE u.username = $1
      LIMIT 1
    `, [username]);

    if (rows.length === 0) {
      return res.status(401).json({ mensaje: "Usuario no existe" });
    }

    const user = rows[0];

    if (!user.active) {
      return res.status(403).json({ mensaje: "Usuario desactivado. Contacta al administrador" });
    }

    const passwordOk = await bcrypt.compare(password, user.password_hash);

    if (!passwordOk) {
      return res.status(401).json({ mensaje: "Contrasena incorrecta" });
    }

    if (user.password_reset_required) {
      if (!user.email || !String(user.email).trim()) {
        return res.status(403).json({
          mensaje: "Tu cuenta requiere cambiar la contrasena, pero no tienes un correo asociado. Contacta al administrador para obtener acceso.",
          password_reset_required: true,
        });
      }

      // El enlace de primer ingreso NO se genera aquí: el administrador es quien
      // lo envía manualmente desde Configuración → Correo. Así el historial de
      // envíos queda controlado por el admin y no se pisan tokens manuales.
      return res.status(403).json({
        mensaje: "Tu cuenta requiere cambiar la contrasena antes de acceder. El administrador te enviara un enlace para crearla; si no lo recibiste, contactalo.",
        password_reset_required: true,
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        nombre: `${user.first_name} ${user.first_surname}`,
        rol: ROLES_MAP[user.role] || user.role,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "8h" }
    );

    await pool.query("UPDATE users SET last_access = NOW() WHERE id = $1", [user.id]);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 8 * 60 * 60 * 1000,
    });

    res.json({
      token,
      password_reset_required: !!user.password_reset_required,
      user: {
        id: user.id,
        username: user.username,
        nombre: `${user.first_name} ${user.first_surname}`,
        rol: user.role,
      },
    });
  } catch (error: unknown) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({ mensaje: "Error en login", detalle: getErrorMessage(error) });
  }
};

export const logout = async (_req: Request, res: Response): Promise<void> => {
  res.clearCookie('token', { httpOnly: true, sameSite: 'strict' });
  res.json({ mensaje: 'Sesión cerrada' });
};

export const cambiarPassword = async (req: Request, res: Response) => {
  try {
    const { password_actual, password_nuevo } = req.body;
    const usuarioId = req.user.id;

    if (!password_actual || !password_nuevo) {
      return res.status(400).json({ mensaje: "Faltan datos" });
    }

    if (password_nuevo.length < 8) {
      return res.status(400).json({ mensaje: "La contrasena debe tener al menos 8 caracteres" });
    }

    const { rows } = await pool.query("SELECT password_hash FROM users WHERE id = $1", [usuarioId]);
    if (!rows.length) return res.status(404).json({ mensaje: "Usuario no encontrado" });

    const valida = await bcrypt.compare(password_actual, rows[0].password_hash);
    if (!valida) return res.status(400).json({ mensaje: "Contrasena actual incorrecta" });

    const hash = await bcrypt.hash(password_nuevo, 10);
    await pool.query("UPDATE users SET password_hash = $1, password_reset_required = false WHERE id = $2", [hash, usuarioId]);

    const { rows: userData } = await pool.query(`
      SELECT u.id, u.username, r.name AS role, u.first_name, u.first_surname
      FROM users u
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      LEFT JOIN roles r ON r.id = ur.role_id
      WHERE u.id = $1
    `, [usuarioId]);

    const token = jwt.sign(
      {
        id: userData[0].id,
        username: userData[0].username,
        nombre: `${userData[0].first_name} ${userData[0].first_surname}`,
        rol: ROLES_MAP[userData[0].role] || userData[0].role,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "8h" }
    );

    res.json({ mensaje: "Contrasena cambiada exitosamente", token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al cambiar contrasena" });
  }
};

export const solicitarResetPassword = async (req: Request, res: Response) => {
  try {
    const { correo } = req.body;

    if (!correo) {
      return res.status(400).json({ mensaje: "Faltan datos" });
    }

    const mensajeGenerico = "Si el correo esta registrado, recibiras un enlace para restablecer tu contrasena";

    const { rows } = await pool.query(
      "SELECT id, username, first_name, first_surname, email FROM users WHERE email = $1",
      [correo]
    );

    if (rows.length === 0) {
      return res.json({ mensaje: mensajeGenerico });
    }

    const usuario = rows[0];
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    await pool.query(
      "UPDATE password_reset_tokens SET used = true WHERE user_id = $1 AND used = false",
      [usuario.id]
    );
    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, now() + interval '30 minutes')`,
      [usuario.id, tokenHash]
    );

    const link = `${process.env.FRONTEND_URL || "http://localhost:3000"}/restablecer-contrasena?token=${token}`;
    await enviarResetPassword({
      email: usuario.email,
      nombre: `${usuario.first_name} ${usuario.first_surname}`,
      link,
    });

    res.json({ mensaje: mensajeGenerico });
  } catch (error: any) {
    console.error("SOLICITAR RESET ERROR:", error);
    res.status(500).json({ mensaje: "Error al solicitar restablecimiento de contrasena" });
  }
};

export const restablecerPassword = async (req: Request, res: Response) => {
  try {
    const { token, password_nuevo } = req.body;

    if (!token || !password_nuevo) {
      return res.status(400).json({ mensaje: "Faltan datos" });
    }

    if (password_nuevo.length < 8) {
      return res.status(400).json({ mensaje: "La contrasena debe tener al menos 8 caracteres" });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const { rows } = await pool.query(
      `SELECT t.id, t.user_id, t.expires_at, t.used
       FROM password_reset_tokens t
       WHERE t.token_hash = $1`,
      [tokenHash]
    );

    if (rows.length === 0 || rows[0].used) {
      return res.status(400).json({ mensaje: "Enlace invalido o ya utilizado" });
    }

    if (new Date(rows[0].expires_at) < new Date()) {
      return res.status(400).json({ mensaje: "El enlace ha expirado" });
    }

    const hash = await bcrypt.hash(password_nuevo, 10);
    await pool.query(
      "UPDATE users SET password_hash = $1, password_reset_required = false WHERE id = $2",
      [hash, rows[0].user_id]
    );
    await pool.query("UPDATE password_reset_tokens SET used = true, used_at = now() WHERE id = $1", [rows[0].id]);

    res.json({ mensaje: "Contrasena restablecida exitosamente" });
  } catch (error: any) {
    console.error("RESTABLECER RESET ERROR:", error);
    res.status(500).json({ mensaje: "Error al restablecer contrasena" });
  }
};

export const validarTokenReset = async (req: Request, res: Response) => {
  try {
    const { token } = req.query;
    if (!token) return res.json({ valido: false, motivo: "invalido" });
    const tokenHash = crypto.createHash("sha256").update(token as string).digest("hex");
    const { rows } = await pool.query(
      `SELECT id, used, expires_at
       FROM password_reset_tokens
       WHERE token_hash = $1`,
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

export const perfil = async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`
      SELECT
          u.id, u.username, u.password_reset_required,
          CONCAT(u.first_name,' ',u.first_surname) AS nombre,
          r.name AS role
      FROM users u
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      LEFT JOIN roles r ON r.id = ur.role_id
      WHERE u.id = $1
    `, [req.user.id]);

    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error perfil" });
  }
};

export const misPermisos = async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`
      SELECT DISTINCT a.name
      FROM user_roles ur
      JOIN role_actions ra ON ra.role_id = ur.role_id
      JOIN actions a ON a.id = ra.action_id
      WHERE ur.user_id = $1
      ORDER BY a.name
    `, [req.user.id]);
    res.json({ permissions: rows.map((r: any) => r.name) });
  } catch (error) {
    console.error("MIS PERMISOS ERROR:", error);
    res.status(500).json({ mensaje: "Error al obtener permisos" });
  }
};
