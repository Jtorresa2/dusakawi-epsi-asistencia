import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { prisma } from '@config/database/prisma/prisma';
import type { LegacyResult } from '../../common/legacy-result';

const require = createRequire(import.meta.url);
const { enviarResetPassword } = require('../../../../../services/emailService.js') as {
  enviarResetPassword: (args: {
    email: string;
    nombre: string;
    link: string;
  }) => Promise<unknown>;
};

interface RequestResetBody {
  correo?: string;
}

export class RequestPasswordResetHandler {
  async handle(body: RequestResetBody): Promise<LegacyResult> {
    try {
      const { correo } = body;

      if (!correo) {
        return { status: 400, body: { mensaje: 'Faltan datos' } };
      }

      const mensajeGenerico =
        'Si el correo esta registrado, recibiras un enlace para restablecer tu contrasena';

      const rows = await prisma.$queryRaw<
        Array<{
          id: string;
          username: string;
          first_name: string | null;
          first_surname: string | null;
          email: string;
        }>
      >`
        SELECT id, username, first_name, first_surname, email
        FROM asistencia.users
        WHERE email = ${correo}
      `;

      if (rows.length === 0) {
        return { status: 200, body: { mensaje: mensajeGenerico } };
      }

      const usuario = rows[0];
      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      await prisma.$executeRaw`
        UPDATE asistencia.password_reset_tokens SET used = true
        WHERE user_id = ${usuario.id} AND used = false
      `;
      await prisma.$executeRaw`
        INSERT INTO asistencia.password_reset_tokens (user_id, token_hash, expires_at)
        VALUES (${usuario.id}, ${tokenHash}, now() + interval '30 minutes')
      `;

      const link = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/restablecer-contrasena?token=${token}`;
      await enviarResetPassword({
        email: usuario.email,
        nombre: `${usuario.first_name} ${usuario.first_surname}`,
        link,
      });

      return { status: 200, body: { mensaje: mensajeGenerico } };
    } catch (error) {
      console.error('SOLICITAR RESET ERROR:', error);
      return {
        status: 500,
        body: { mensaje: 'Error al solicitar restablecimiento de contrasena' },
      };
    }
  }
}
