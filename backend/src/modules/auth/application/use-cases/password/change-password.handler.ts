import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@config/database/prisma/prisma';
import type { LegacyResult } from '../../common/legacy-result';

const rolesMap: Record<string, string> = {
  Administrador: 'admin',
  'Talento Humano': 'talento_humano',
};

interface ChangePasswordBody {
  password_actual?: string;
  password_nuevo?: string;
}

interface UserRow {
  id?: string;
  username?: string;
  rol?: string | null;
  first_name?: string | null;
  first_surname?: string | null;
}

export class ChangePasswordHandler {
  async handle(body: ChangePasswordBody, userId: string): Promise<LegacyResult> {
    try {
      const { password_actual, password_nuevo } = body;

      if (!password_actual || !password_nuevo) {
        return { status: 400, body: { mensaje: 'Faltan datos' } };
      }

      if (password_nuevo.length < 8) {
        return {
          status: 400,
          body: { mensaje: 'La contrasena debe tener al menos 8 caracteres' },
        };
      }

      const rows = await prisma.$queryRaw<Array<{ password_hash: string }>>`
        SELECT password_hash FROM asistencia.users WHERE id = ${userId}
      `;
      if (!rows.length) {
        return { status: 404, body: { mensaje: 'Usuario no encontrado' } };
      }

      const valida = await bcrypt.compare(password_actual, rows[0].password_hash);
      if (!valida) {
        return { status: 400, body: { mensaje: 'Contrasena actual incorrecta' } };
      }

      const hash = await bcrypt.hash(password_nuevo, 10);
      await prisma.$executeRaw`
        UPDATE asistencia.users SET password_hash = ${hash} WHERE id = ${userId}
      `;

      // Generar nuevo token
      const userData = await prisma.$queryRaw<Array<UserRow>>`
        SELECT u.id, u.username, r.name AS rol, u.first_name, u.first_surname
        FROM asistencia.users u
        LEFT JOIN asistencia.user_roles ur ON u.id = ur.user_id
        LEFT JOIN asistencia.roles r ON ur.role_id = r.id
        WHERE u.id = ${userId}
      `;

      const user: UserRow = userData[0] || {};
      const fullName = `${user.first_name || ''} ${user.first_surname || ''}`.trim();
      const rolValue = rolesMap[user.rol ?? ''] ?? user.rol ?? undefined;
      const token = jwt.sign(
        {
          id: user.id,
          empleado_id: user.id,
          username: user.username,
          nombre: fullName,
          rol: rolValue,
          roles: user.rol ? [user.rol] : [],
        },
        process.env.JWT_SECRET || 'dusakawi_jwt_secret_2024',
        { expiresIn: '8h' },
      );

      return {
        status: 200,
        body: { mensaje: 'Contrasena cambiada exitosamente', token },
      };
    } catch (error) {
      console.error(error);
      return { status: 500, body: { mensaje: 'Error al cambiar contrasena' } };
    }
  }
}
