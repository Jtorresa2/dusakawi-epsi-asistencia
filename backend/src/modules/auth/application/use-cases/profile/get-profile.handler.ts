import { prisma } from '@config/database/prisma/prisma';
import type { LegacyResult } from '../../common/legacy-result';

export class GetProfileHandler {
  async handle(userId: string): Promise<LegacyResult> {
    try {
      const rows = await prisma.$queryRaw<
        Array<{
          id: string;
          username: string;
          nombre: string | null;
          rol: string | null;
        }>
      >`
        SELECT
            u.id, u.username,
            CASE
              WHEN LOWER(u.username) = 'administrador' OR u.first_name ILIKE 'administrador%' THEN 'Administrador'
              ELSE TRIM(CONCAT(u.first_name, ' ', COALESCE(u.first_surname, '')))
            END AS nombre,
            r.name AS rol
        FROM asistencia.users u
        LEFT JOIN asistencia.user_roles ur ON u.id = ur.user_id
        LEFT JOIN asistencia.roles r ON ur.role_id = r.id
        WHERE u.id = ${userId}
      `;

      return { status: 200, body: rows[0] };
    } catch (error) {
      console.error(error);
      return { status: 500, body: { mensaje: 'Error perfil' } };
    }
  }
}
