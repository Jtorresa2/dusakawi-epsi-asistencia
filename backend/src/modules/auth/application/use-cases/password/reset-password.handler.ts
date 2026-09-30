import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { prisma } from '@config/database/prisma/prisma';
import type { LegacyResult } from '../../common/legacy-result';

interface ResetPasswordBody {
  token?: string;
  password_nuevo?: string;
}

export class ResetPasswordHandler {
  async handle(body: ResetPasswordBody): Promise<LegacyResult> {
    try {
      const { token, password_nuevo } = body;

      if (!token || !password_nuevo) {
        return { status: 400, body: { mensaje: 'Faltan datos' } };
      }

      if (password_nuevo.length < 8) {
        return {
          status: 400,
          body: { mensaje: 'La contrasena debe tener al menos 8 caracteres' },
        };
      }

      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      const rows = await prisma.$queryRaw<
        Array<{ id: number; user_id: string; expires_at: Date; used: boolean }>
      >`
        SELECT t.id, t.user_id, t.expires_at, t.used
        FROM asistencia.password_reset_tokens t
        WHERE t.token_hash = ${tokenHash}
      `;

      if (rows.length === 0 || rows[0].used) {
        return { status: 400, body: { mensaje: 'Enlace invalido o ya utilizado' } };
      }

      if (new Date(rows[0].expires_at) < new Date()) {
        return { status: 400, body: { mensaje: 'El enlace ha expirado' } };
      }

      const hash = await bcrypt.hash(password_nuevo, 10);
      await prisma.$executeRaw`
        UPDATE asistencia.users
        SET password_hash = ${hash}, password_reset_required = false
        WHERE id = ${rows[0].user_id}
      `;
      await prisma.$executeRaw`
        UPDATE asistencia.password_reset_tokens
        SET used = true, used_at = now()
        WHERE id = ${rows[0].id}
      `;

      return { status: 200, body: { mensaje: 'Contrasena restablecida exitosamente' } };
    } catch (error) {
      console.error('RESTABLECER RESET ERROR:', error);
      return { status: 500, body: { mensaje: 'Error al restablecer contrasena' } };
    }
  }
}
