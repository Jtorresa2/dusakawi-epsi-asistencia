import { Prisma } from '@config/database/prisma/generated/client';
import { prisma } from '@config/database/prisma/prisma';
import type { GetIndicadoresQueryDto } from '@modules/dashboard/application/use-cases/get-indicadores/get-indicadores-query.dto';
import type { DashboardIndicadoresFullEntity } from '@modules/dashboard/domain/entities/dashboard-indicadores';
import type { DashboardIndicadoresRepository } from '@modules/dashboard/domain/repositories/dashboard-indicadores-repository';

function getDateRange(periodo: string): { start: Date; end: Date } {
  const hoy = new Date();
  const yyyy = hoy.getFullYear();
  const mm = String(hoy.getMonth() + 1).padStart(2, '0');
  const dd = String(hoy.getDate()).padStart(2, '0');
  const hoyStr = `${yyyy}-${mm}-${dd}`;

  switch (periodo) {
    case 'Esta semana': {
      const dayOfWeek = hoy.getDay();
      const lunesOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const lunes = new Date(hoy);
      lunes.setDate(hoy.getDate() - lunesOffset);
      const domingo = new Date(lunes);
      domingo.setDate(lunes.getDate() + 6);
      return { start: lunes, end: domingo };
    }
    case 'Este mes': {
      const first = new Date(yyyy, hoy.getMonth(), 1);
      const last = new Date(yyyy, hoy.getMonth() + 1, 0);
      return { start: first, end: last };
    }
    case 'Último año': {
      const start = new Date(yyyy - 1, hoy.getMonth(), hoy.getDate());
      return { start, end: hoy };
    }
    default: // Hoy
      return { start: hoy, end: hoy };
  }
}

function statusDisplay(status: string): string {
  if (status === 'on_time') return 'puntual';
  if (status === 'late') return 'tardanza';
  if (status === 'absent') return 'ausente';
  if (status === 'justified') return 'justificado';
  return status || 'puntual';
}

export class PrismaDashboardIndicadoresRepository implements DashboardIndicadoresRepository {
  async getIndicadores(request: GetIndicadoresQueryDto): Promise<DashboardIndicadoresFullEntity> {
    const periodo = request.periodo || 'Hoy';
    const { start, end } = getDateRange(periodo);

    // Indicadores filtrados por período
    const indicadores = await prisma.$queryRaw<{ presentes_hoy: bigint; ausentes_hoy: bigint; tardanzas_hoy: bigint; puntualidad: number }[]>`
      SELECT 
        COUNT(DISTINCT CASE WHEN a.status IN ('on_time','late') THEN a.user_id END) AS presentes_hoy,
        COUNT(DISTINCT CASE WHEN a.status = 'absent' THEN a.user_id END) AS ausentes_hoy,
        COUNT(DISTINCT CASE WHEN a.status = 'late' THEN a.user_id END) AS tardanzas_hoy,
        CASE WHEN COUNT(*) > 0 
          THEN ROUND(SUM(CASE WHEN a.status = 'on_time' THEN 1 ELSE 0 END)::numeric / COUNT(*) * 100, 1) 
          ELSE 100 
        END AS puntualidad
      FROM asistencia.attendances a
      WHERE a.date BETWEEN ${start} AND ${end}
    `;

    // Horas extra en el período
    const extras = await prisma.$queryRaw<{ horas_extras: number }[]>`
      SELECT COALESCE(SUM(a.extra_hours), 0) AS horas_extras
      FROM asistencia.attendances a
      WHERE a.date BETWEEN ${start} AND ${end}
    `;

    // Permisos/incidencias aprobadas en el período
    const permisos = await prisma.$queryRaw<{ total: bigint }[]>`
      SELECT COUNT(*) AS total FROM asistencia.incidents
      WHERE LOWER(status) IN ('approved', 'aprobado', 'aprobada')
        AND DATE(created_at) BETWEEN ${start} AND ${end}
    `;

    // Asistencia de hoy (registros)
    const asistenciaHoy = await prisma.$queryRaw<{
      id: string;
      nombre: string;
      apellido: string;
      fecha: Date;
      estado: string;
      fecha_hora_entrada: string | null;
      fecha_hora_salida_manana: string | null;
      fecha_hora_entrada_tarde: string | null;
      fecha_hora_salida: string | null;
      horas_trabajadas: number | null;
      minutos_tardanza: number | null;
    }[]>`
      SELECT
        a.id,
        u.first_name AS nombre,
        u.first_surname AS apellido,
        a.date::date AS fecha,
        a.status AS estado,
        TO_CHAR(a.entry_timestamp, 'HH24:MI') AS fecha_hora_entrada,
        TO_CHAR(a.morning_departure_timestamp, 'HH24:MI') AS fecha_hora_salida_manana,
        TO_CHAR(a.afternoon_entry_timestamp, 'HH24:MI') AS fecha_hora_entrada_tarde,
        TO_CHAR(a.departure_timestamp, 'HH24:MI') AS fecha_hora_salida,
        a.worked_hours::numeric AS horas_trabajadas,
        a.late_minutes AS minutos_tardanza
      FROM asistencia.attendances a
      JOIN asistencia.users u ON a.user_id = u.id
      WHERE a.date = CURRENT_DATE
      ORDER BY a.entry_timestamp ASC NULLS LAST
      LIMIT 10
    `;

    const registros = asistenciaHoy.map((r) => ({
      ...r,
      fecha: r.fecha.toISOString().split('T')[0],
      estado: statusDisplay(r.estado),
      horas_trabajadas: r.horas_trabajadas !== null ? Number(r.horas_trabajadas) : null,
    }));

    // Semanal
    const semanal = await prisma.$queryRaw<{ dia: string; presentes: bigint; ausentes: bigint }[]>`
      SELECT 
        TRIM(TO_CHAR(date, 'Day')) AS dia,
        SUM((status != 'absent')::int) AS presentes,
        SUM((status = 'absent')::int) AS ausentes
      FROM asistencia.attendances
      WHERE date >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY date, TRIM(TO_CHAR(date, 'Day'))
      ORDER BY date
    `;

    // Mensual
    const mensual = await prisma.$queryRaw<{ mes: string; puntualidad: number; ausentismo: number }[]>`
      SELECT 
        EXTRACT(MONTH FROM date) AS mes,
        ROUND(SUM((status = 'on_time')::int)::numeric / GREATEST(COUNT(*), 1) * 100, 1) AS puntualidad,
        ROUND(SUM((status = 'absent')::int)::numeric / GREATEST(COUNT(*), 1) * 100, 1) AS ausentismo
      FROM asistencia.attendances
      WHERE EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)
      GROUP BY EXTRACT(MONTH FROM date)
      ORDER BY mes
    `;

    const ind = indicadores[0] || { presentes_hoy: 0n, ausentes_hoy: 0n, tardanzas_hoy: 0n, puntualidad: 100 };

    return {
      indicadores: {
        puntualidad: ind.puntualidad ?? 100,
        presentes_hoy: Number(ind.presentes_hoy),
        ausentes_hoy: Number(ind.ausentes_hoy),
        tardanzas_hoy: Number(ind.tardanzas_hoy),
        horas_extras_hoy: extras[0]?.horas_extras ?? 0,
        permisos_hoy: Number(permisos[0]?.total ?? 0),
      },
      registros,
      semanal: semanal.map((s) => ({
        dia: s.dia,
        presentes: Number(s.presentes),
        ausentes: Number(s.ausentes),
      })),
      mensual: mensual.map((m) => ({
        mes: String(m.mes),
        puntualidad: m.puntualidad,
        ausentismo: m.ausentismo,
      })),
    };
  }
}