import { prisma } from '@config/database/prisma/prisma';
import type { DashboardResumenAreaEntity } from '@modules/dashboard/domain/entities/dashboard-resumen-area';
import type { DashboardResumenAreaRepository } from '@modules/dashboard/domain/repositories/dashboard-resumen-area-repository';

export class PrismaDashboardResumenAreaRepository implements DashboardResumenAreaRepository {
  async getResumenPorArea(): Promise<DashboardResumenAreaEntity[]> {
    const rows = await prisma.$queryRaw<{
      id: string;
      area: string;
      total: bigint;
      presentes: bigint;
      ausentes: bigint;
      tardanzas: bigint;
    }[]>`
      SELECT
        ar.id,
        ar.name AS area,
        COUNT(a.id) AS total,
        SUM(CASE WHEN a.status = 'on_time' THEN 1 ELSE 0 END) AS presentes,
        SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) AS ausentes,
        SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) AS tardanzas
      FROM asistencia.attendances a
      JOIN asistencia.users u ON a.user_id = u.id
      JOIN asistencia.areas ar ON u.area_id = ar.id
      WHERE a.date = CURRENT_DATE
      GROUP BY ar.id, ar.name
      ORDER BY ar.name
    `;

    return rows.map((r) => ({
      id: r.id,
      area: r.area,
      presentes: Number(r.presentes),
      ausentes: Number(r.ausentes),
      tardanzas: Number(r.tardanzas),
      total: Number(r.total),
      porcentaje_asistencia: r.total > 0
        ? Math.round(((Number(r.presentes) + Number(r.tardanzas)) / Number(r.total)) * 100)
        : 0,
    }));
  }
}