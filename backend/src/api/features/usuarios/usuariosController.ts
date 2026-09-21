import pool from '../../../config/db';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { enviarResetPassword } from '../../shared/services/emailService';
import * as personalService from '../empleados/personalService';
import { Request, Response } from 'express';
import { esIdValido } from '../../shared/utils/validators';

export const getUsuarios = async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        u.id, u.username, u.active AS activo, u.password_reset_required, u.last_access, u.created_at,
        r.name AS rol,
        CONCAT(u.first_name, ' ', u.first_surname) AS employee,
        u.first_name AS nombre, u.first_surname AS apellido,
        dd.document_number AS cedula, u.email AS correo,
        c.name AS cargo, u.position_id AS cargo_id, u.area_id,
        a.name AS area,
        NULLIF(regexp_replace(f.name, '\\D', '', 'g'), '')::int AS piso
      FROM users u
      JOIN user_roles ur ON ur.user_id = u.id
      JOIN roles r ON r.id = ur.role_id
      LEFT JOIN positions c ON u.position_id = c.id
      LEFT JOIN areas a ON u.area_id = a.id
      LEFT JOIN floors f ON a.floor_id = f.id
      LEFT JOIN document_details dd ON dd.user_id = u.id
      ORDER BY u.created_at DESC
    `);
    res.json({ users: rows });
  } catch (err: any) {
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
};

export const getRoles = async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`
      SELECT r.id, r.name AS nombre, r.description AS descripcion, COUNT(u.id) AS cantidad_usuarios
      FROM roles r
      LEFT JOIN user_roles ur ON ur.role_id = r.id
      LEFT JOIN users u ON u.id = ur.user_id
      GROUP BY r.id, r.name, r.description
      ORDER BY r.id
    `);
    res.json({ roles: rows });
  } catch (err: any) {
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
};

export const getPermisosRol = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!esIdValido(String(id))) {
      return res.status(400).json({ mensaje: 'Id inválido' });
    }
    const { rows: rol } = await pool.query('SELECT id FROM roles WHERE id = $1', [id]);
    if (!rol.length) return res.status(404).json({ mensaje: 'Rol no encontrado' });

    const { rows } = await pool.query(
      `SELECT acc.name
       FROM actions acc
       JOIN role_actions ra ON ra.action_id = acc.id
       WHERE ra.role_id = $1`,
      [id]
    );
    res.json({ permissions: rows.map((r: any) => r.name) });
  } catch (err: any) {
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
};

export const updateRol = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!esIdValido(String(id))) {
    return res.status(400).json({ mensaje: 'Id inválido' });
  }
  const { descripcion, permisos } = req.body;

  const acciones = Array.isArray(permisos) ? permisos : [];

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: rol } = await client.query('SELECT id FROM roles WHERE id = $1', [id]);
    if (!rol.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ mensaje: 'Rol no encontrado' });
    }

    if (descripcion !== undefined) {
      await client.query('UPDATE roles SET description = $1 WHERE id = $2', [descripcion, id]);
    }

    await client.query('DELETE FROM role_actions WHERE role_id = $1', [id]);

    if (acciones.length) {
      await client.query(
        `INSERT INTO role_actions (role_id, action_id)
         SELECT $1, acc.id FROM actions acc WHERE acc.name = ANY($2::text[])`,
        [id, acciones]
      );
    }

    await client.query('COMMIT');
    res.json({ mensaje: 'Rol actualizado correctamente' });
  } catch (err: any) {
    try { await client.query('ROLLBACK'); } catch {}
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  } finally {
    client.release();
  }
};

export const getPendientesEmail = async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`
      SELECT u.id,
             CONCAT(u.first_name, ' ', u.first_surname) AS nombre,
             u.username,
             u.email,
             u.password_reset_required,
             r.name AS rol,
             t.ultimo_envio,
             t.expira,
             t.aceptado_en,
             CASE
               WHEN u.password_reset_required = FALSE THEN 'aceptado'
               WHEN t.ultimo_envio IS NULL THEN 'sin_enviar'
               WHEN t.expira IS NULL OR t.expira > now() THEN 'enviado'
               ELSE 'expirado'
             END AS estado
      FROM users u
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      LEFT JOIN roles r ON r.id = ur.role_id
      LEFT JOIN LATERAL (
        SELECT pt.created_at AS ultimo_envio,
               pt.expires_at AS expira,
               CASE WHEN pt.used THEN pt.used_at ELSE NULL END AS aceptado_en
        FROM password_reset_tokens pt
        WHERE pt.user_id = u.id
        ORDER BY pt.created_at DESC
        LIMIT 1
      ) t ON TRUE
      WHERE u.active = TRUE
        AND u.email IS NOT NULL AND u.email <> ''
        AND (u.password_reset_required = TRUE OR t.ultimo_envio IS NOT NULL)
      ORDER BY u.password_reset_required DESC, u.first_name, u.first_surname
    `);
    res.json({ pendientes: rows });
  } catch (err: any) {
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
};

export const enviarEmailAcceso = async (req: Request, res: Response) => {
  try {
    const { userIds, todos } = req.body;

    let targets: any[] = [];

    if (todos) {
      const { rows } = await pool.query(`
        SELECT u.id
        FROM users u
        WHERE u.active = TRUE
          AND u.email IS NOT NULL AND u.email <> ''
          AND u.password_reset_required = TRUE
      `);
      targets = rows;
    } else if (Array.isArray(userIds) && userIds.length) {
      targets = userIds.map((id: number) => ({ id }));
    } else {
      return res.status(400).json({ mensaje: 'Indique usuarios o use todos' });
    }

    const link = process.env.FRONTEND_URL || 'http://localhost:3000';
    let enviados = 0;
    let fallidos = 0;
    let sin_correo = 0;
    const resultados: any[] = [];

    for (const t of targets) {
      const { rows } = await pool.query(
        `SELECT id, first_name, first_surname, username, password_hash, email
         FROM users WHERE id = $1`,
        [t.id]
      );
      const user = rows[0];
      if (!user) {
        fallidos++;
        resultados.push({ id: t.id, nombre: '?', username: '?', email: '?', enviado: false, motivo: 'NO ENCONTRADO' });
        continue;
      }

      if (!user.email || !user.email.trim()) {
        sin_correo++;
        resultados.push({
          id: user.id,
          nombre: `${user.first_name} ${user.first_surname}`,
          username: user.username,
          email: 'SIN CORREO',
          enviado: false,
          motivo: 'SIN CORREO'
        });
        continue;
      }

      let finalUsername = user.username;
      let finalPassword = null;

      if (!finalUsername || !finalUsername.trim()) {
        finalUsername = personalService.generarUsername(user.first_name, user.first_surname, undefined);
        let counter = 1;
        while (true) {
          const { rows: dup } = await pool.query('SELECT id FROM users WHERE username = $1', [finalUsername]);
          if (!dup.length) break;
          finalUsername = `${finalUsername}${counter++}`;
        }
      }

      if (!user.password_hash) {
        finalPassword = crypto.randomBytes(32).toString("hex");
        const hash = await bcrypt.hash(finalPassword, 10);
        await pool.query(
          `UPDATE users SET username = $1, password_hash = $2, password_reset_required = TRUE WHERE id = $3`,
          [finalUsername, hash, user.id]
        );
      } else if (finalUsername !== user.username) {
        await pool.query(
          `UPDATE users SET username = $1 WHERE id = $2`,
          [finalUsername, user.id]
        );
      }

      await pool.query(
        `UPDATE password_reset_tokens SET used = true WHERE user_id = $1 AND used = false`,
        [user.id]
      );

      const resetToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
      await pool.query(
        `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
         VALUES ($1, $2, now() + interval '7 days')`,
        [user.id, tokenHash]
      );

      let r: any = null;
      try {
        r = await enviarResetPassword({
          email: user.email,
          nombre: `${user.first_name} ${user.first_surname}`,
          username: finalUsername,
          link: `${link}/restablecer-contrasena?token=${resetToken}`,
          primerIngreso: true
        });
      } catch {}

      if (r && r.enviado === true) {
        enviados++;
      } else {
        fallidos++;
      }

      resultados.push({
        id: user.id,
        nombre: `${user.first_name} ${user.first_surname}`,
        username: finalUsername,
        email: user.email,
        enviado: !!(r && r.enviado === true),
        motivo: !(r && r.enviado === true) ? (r?.motivo || 'ENVIO FALLIDO') : undefined
      });
    }

    res.json({ enviados, fallidos, sin_correo, resultados });
  } catch (err: any) {
    res.status(500).json({ mensaje: 'Error del servidor', error: err.message });
  }
};
