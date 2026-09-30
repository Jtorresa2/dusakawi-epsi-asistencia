import crypto from 'node:crypto';
import { prisma } from '@config/database/prisma/prisma';
import type { LegacyResult } from '../../common/legacy-result';

export class ValidateResetTokenHandler {
  async handle(token: string | string[] | undefined): Promise<LegacyResult> {
    try {
      if (!token) {
        return { status: 200, body: { valido: false, motivo: 'invalido' } };
      }

      const tokenHash = crypto.createHash('sha256').update(String(token)).digest('hex');
      const rows = await prisma.$queryRaw<
        Array<{ id: number; used: boolean; expires_at: Date }>
      >`
        SELECT id, used, expires_at
        FROM asistencia.password_reset_tokens
        WHERE token_hash = ${tokenHash}
      `;

      if (rows.length === 0) {
        return { status: 200, body: { valido: false, motivo: 'invalido' } };
      }
      if (rows[0].used) {
        return { status: 200, body: { valido: false, motivo: 'usado' } };
      }
      if (new Date(rows[0].expires_at) < new Date()) {
        return { status: 200, body: { valido: false, motivo: 'expirado' } };
      }

      return { status: 200, body: { valido: true } };
    } catch (error) {
      console.error('VALIDAR TOKEN RESET ERROR:', error);
      return { status: 500, body: { mensaje: 'Error al validar el enlace' } };
    }
  }
}
