import { prisma } from '@config/database/prisma/prisma';
import type { LegacyResult } from '../../common/legacy-result';

export class GetPermissionsHandler {
  async handle(userId: string): Promise<LegacyResult> {
    try {
      const rows = await prisma.$queryRaw<Array<{ name: string }>>`
        SELECT DISTINCT a.name
        FROM asistencia.user_roles ur
        JOIN asistencia.role_actions ra ON ra.role_id = ur.role_id
        JOIN asistencia.actions a ON a.id = ra.action_id
        WHERE ur.user_id = ${userId}
        ORDER BY a.name
      `;

      return { status: 200, body: { permissions: rows.map((r) => r.name) } };
    } catch (error) {
      console.error('MIS PERMISOS ERROR:', error);
      return { status: 500, body: { mensaje: 'Error al obtener permisos' } };
    }
  }
}
