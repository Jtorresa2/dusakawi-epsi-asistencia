import { Prisma } from '@config/database/prisma/generated/client';
import { prisma } from '@config/database/prisma/prisma';
import { createRequire } from 'node:module';
import type {
  AbsenceFilters,
  AbsenceRecord,
  AttendanceFilters,
  AttendanceRecord,
  AreaReportFilters,
  AreaReportRecord,
  DailyRecord,
  DailySummary,
  EmployeeDetailRow,
  EmployeeReportData,
  EmployeeReportFilters,
  EmployeeReportRecord,
  EmployeeRow,
  EmployeeSummaryRow,
  HistoryRow,
  IncidentFilters,
  IncidentRecord,
  IncidentSummaryRow,
  IndicatorData,
  LateArrivalFilters,
  LateArrivalRecord,
  MarkingFilters,
  MarkingRecord,
  MonthlyAreaRow,
  MonthlyDayRow,
  MonthlyReportData,
  MonthlySummary,
  HolidayCountRow,
  HolidayRow,
  PermitSummaryRow,
  SaveHistoryCommand,
  TrendRow,
} from '@modules/reportes/domain/entities/report';
import type { ReportRepository } from '@modules/reportes/domain/repositories/report-repository';

const require = createRequire(import.meta.url);
const { excluirRolesPorNombre, excluirRolesPorUserId, joinRoles } = require(
  '../../../../../../services/rolesFiltro.js',
);

const qualifyRoleSql = (sql: string) =>
  sql
    .replace(/\buser_roles\b/g, 'asistencia.user_roles')
    .replace(/\broles\b/g, 'asistencia.roles');

const roleFilterByUserId = (column: string): Prisma.Sql =>
  Prisma.raw(qualifyRoleSql(excluirRolesPorUserId(column)));

const roleFilterByName = (alias: string): Prisma.Sql =>
  Prisma.raw(qualifyRoleSql(excluirRolesPorNombre(alias)));

const roleJoin = (expression: string): Prisma.Sql =>
  Prisma.raw(qualifyRoleSql(joinRoles(expression)));

export class PrismaReportRepository implements ReportRepository {
  async getDailyRecords(date: string): Promise<DailyRecord[]> {
    return prisma.$queryRaw<DailyRecord[]>`
      SELECT
        TRIM(CONCAT(e.first_name, ' ', COALESCE(e.middle_name, ''), ' ', e.first_surname, ' ', COALESCE(e.second_surname, ''))) AS empleado,
        COALESCE(dd.document_number, '') AS cedula,
        COALESCE(ar.name, '') AS area,
        COALESCE(fl.name, '') AS piso,
        TO_CHAR(a.date, 'YYYY-MM-DD') AS fecha,
        TO_CHAR(a.entry_timestamp, 'HH24:MI') AS entrada1,
        TO_CHAR(a.morning_departure_timestamp, 'HH24:MI') AS salida1,
        TO_CHAR(a.afternoon_entry_timestamp, 'HH24:MI') AS entrada2,
        TO_CHAR(a.departure_timestamp, 'HH24:MI') AS salida2,
        COALESCE(a.worked_hours, 0)::text AS horas_trabajadas,
        COALESCE(a.extra_hours, 0)::text AS horas_extra,
        COALESCE(a.late_minutes, 0) AS minutos_tardanza,
        COALESCE(a.mark_type, 'Web') AS tipo_marcacion,
        COALESCE(a.status, 'on_time') AS estado,
        a.observation AS observacion
      FROM asistencia.attendances a
      JOIN asistencia.users e ON a.user_id = e.id
      LEFT JOIN asistencia.document_details dd ON dd.user_id = e.id
      LEFT JOIN asistencia.areas ar ON e.area_id = ar.id
      LEFT JOIN asistencia.floors fl ON ar.floor_id = fl.id
      WHERE a.date = ${date}::date${roleFilterByUserId('a.user_id')}
      ORDER BY fl.name, ar.name, e.first_surname
    `;
  }

  async getDailySummary(date: string): Promise<DailySummary[]> {
    return prisma.$queryRaw<DailySummary[]>`
      SELECT
        COUNT(*)::text AS total,
        COALESCE(SUM((status = 'on_time')::int), 0)::text AS puntuales,
        COALESCE(SUM((status = 'late')::int), 0)::text AS tardanzas,
        COALESCE(SUM((status = 'absent')::int), 0)::text AS ausentes,
        COALESCE(SUM((status = 'justified')::int), 0)::text AS justificados,
        CASE WHEN COUNT(*) > 0 THEN ROUND(SUM((status != 'absent')::int)::numeric / COUNT(*) * 100, 1) ELSE 0 END::text AS porcentaje_asistencia,
        COALESCE(SUM(extra_hours), 0)::text AS total_horas_extra,
        COALESCE(AVG(late_minutes), 0)::text AS promedio_tardanza
      FROM asistencia.attendances
      WHERE date = ${date}::date${roleFilterByUserId('user_id')}
    `;
  }

  async getMonthlyReport(month: number, year: number): Promise<MonthlyReportData> {
    const holidays = await prisma.$queryRaw<HolidayRow[]>`
      SELECT TO_CHAR(date, 'YYYY-MM-DD') AS fecha, name AS nombre
      FROM asistencia.holidays
      WHERE active = TRUE
        AND EXTRACT(MONTH FROM date) = ${month}
        AND EXTRACT(YEAR FROM date) = ${year}
    `;
    const days = await prisma.$queryRaw<MonthlyDayRow[]>`
      SELECT
        TO_CHAR(date, 'YYYY-MM-DD') AS fecha,
        COUNT(*)::text AS total,
        SUM((status = 'on_time')::int)::text AS puntuales,
        SUM((status = 'late')::int)::text AS tardanzas,
        SUM((status = 'absent')::int)::text AS ausentes,
        ROUND(SUM((status != 'absent')::int)::numeric / GREATEST(COUNT(*), 1) * 100, 1)::text AS porcentaje_asistencia
      FROM asistencia.attendances
      WHERE EXTRACT(MONTH FROM date) = ${month}
        AND EXTRACT(YEAR FROM date) = ${year}${roleFilterByUserId('user_id')}
      GROUP BY date, TO_CHAR(date, 'YYYY-MM-DD')
      ORDER BY fecha
    `;
    const areas = await prisma.$queryRaw<MonthlyAreaRow[]>`
      SELECT
        ar.name AS area,
        fl.name AS piso,
        COUNT(*)::text AS total,
        SUM((a.status = 'on_time')::int)::text AS puntuales,
        SUM((a.status = 'late')::int)::text AS tardanzas,
        SUM((a.status = 'absent')::int)::text AS ausentes,
        ROUND(SUM((a.status != 'absent')::int)::numeric / GREATEST(COUNT(*), 1) * 100, 1)::text AS porcentaje_asistencia
      FROM asistencia.attendances a
      JOIN asistencia.users e ON a.user_id = e.id
      JOIN asistencia.areas ar ON e.area_id = ar.id
      LEFT JOIN asistencia.floors fl ON ar.floor_id = fl.id
      WHERE EXTRACT(MONTH FROM a.date) = ${month}
        AND EXTRACT(YEAR FROM a.date) = ${year}${roleFilterByUserId('a.user_id')}
      GROUP BY ar.id, ar.name, fl.name
      ORDER BY fl.name, ar.name
    `;
    const summary = await prisma.$queryRaw<MonthlySummary[]>`
      SELECT
        COUNT(*)::text AS total_registros,
        SUM((status = 'on_time')::int)::text AS puntuales,
        SUM((status = 'late')::int)::text AS tardanzas,
        SUM((status = 'absent')::int)::text AS ausentes,
        COALESCE(SUM(extra_hours), 0)::text AS total_horas_extra,
        ROUND(SUM((status != 'absent')::int)::numeric / GREATEST(COUNT(*), 1) * 100, 1)::text AS porcentaje_asistencia,
        ROUND(SUM((status = 'on_time')::int)::numeric / GREATEST(COUNT(*), 1) * 100, 1)::text AS porcentaje_puntualidad
      FROM asistencia.attendances
      WHERE EXTRACT(MONTH FROM date) = ${month}
        AND EXTRACT(YEAR FROM date) = ${year}${roleFilterByUserId('user_id')}
    `;

    return { holidays, days, areas, summary };
  }

  async getIndicators(
    month: number,
    year: number,
    previousMonth: number,
    previousYear: number,
  ): Promise<IndicatorData> {
    const activeRows = await prisma.$queryRaw<{ activos: string }[]>`
      SELECT COUNT(*)::text AS activos
      FROM asistencia.users
      WHERE 1=1${roleFilterByUserId('id')}
    `;
    const previousActiveRows = await prisma.$queryRaw<{ activos: string }[]>`
      SELECT COUNT(*)::text AS activos
      FROM asistencia.users
      WHERE EXTRACT(YEAR FROM created_at) = ${previousYear}
        AND EXTRACT(MONTH FROM created_at) = ${previousMonth}${roleFilterByUserId('id')}
    `;
    const attendanceRows = await prisma.$queryRaw<{ asis: string | null }[]>`
      SELECT ROUND(SUM((status != 'absent')::int)::numeric / NULLIF(COUNT(*), 0) * 100, 1)::text AS asis
      FROM asistencia.attendances
      WHERE EXTRACT(MONTH FROM date) = ${month}
        AND EXTRACT(YEAR FROM date) = ${year}${roleFilterByUserId('user_id')}
    `;
    const previousAttendanceRows = await prisma.$queryRaw<{ asis: string | null }[]>`
      SELECT ROUND(SUM((status != 'absent')::int)::numeric / NULLIF(COUNT(*), 0) * 100, 1)::text AS asis
      FROM asistencia.attendances
      WHERE EXTRACT(MONTH FROM date) = ${previousMonth}
        AND EXTRACT(YEAR FROM date) = ${previousYear}${roleFilterByUserId('user_id')}
    `;
    const lateRows = await prisma.$queryRaw<{ tard: string }[]>`
      SELECT COUNT(*)::text AS tard
      FROM asistencia.attendances
      WHERE EXTRACT(MONTH FROM date) = ${month}
        AND EXTRACT(YEAR FROM date) = ${year}${roleFilterByUserId('user_id')}
        AND status = 'late'
    `;
    const previousLateRows = await prisma.$queryRaw<{ tard: string }[]>`
      SELECT COUNT(*)::text AS tard
      FROM asistencia.attendances
      WHERE EXTRACT(MONTH FROM date) = ${previousMonth}
        AND EXTRACT(YEAR FROM date) = ${previousYear}${roleFilterByUserId('user_id')}
        AND status = 'late'
    `;
    const incidentRows = await prisma.$queryRaw<{ inc: string }[]>`
      SELECT COUNT(*)::text AS inc
      FROM asistencia.incidents
      WHERE status = 'pending'${roleFilterByUserId('user_id')}
    `;
    const previousIncidentRows = await prisma.$queryRaw<{ inc: string }[]>`
      SELECT COUNT(*)::text AS inc
      FROM asistencia.incidents
      WHERE status = 'pending'
        AND EXTRACT(MONTH FROM created_at) = ${previousMonth}
        AND EXTRACT(YEAR FROM created_at) = ${previousYear}${roleFilterByUserId('user_id')}
    `;
    const absenceRows = await prisma.$queryRaw<{ aus: string }[]>`
      SELECT COUNT(*)::text AS aus
      FROM asistencia.attendances
      WHERE EXTRACT(MONTH FROM date) = ${month}
        AND EXTRACT(YEAR FROM date) = ${year}${roleFilterByUserId('user_id')}
        AND status = 'absent'
    `;
    const previousAbsenceRows = await prisma.$queryRaw<{ aus: string }[]>`
      SELECT COUNT(*)::text AS aus
      FROM asistencia.attendances
      WHERE EXTRACT(MONTH FROM date) = ${previousMonth}
        AND EXTRACT(YEAR FROM date) = ${previousYear}${roleFilterByUserId('user_id')}
        AND status = 'absent'
    `;
    const reportRows = await prisma.$queryRaw<{ reps: string }[]>`
      SELECT COUNT(*)::text AS reps
      FROM asistencia.report_history
      WHERE EXTRACT(MONTH FROM generated_at) = ${month}
        AND EXTRACT(YEAR FROM generated_at) = ${year}
    `;
    const previousReportRows = await prisma.$queryRaw<{ reps: string }[]>`
      SELECT COUNT(*)::text AS reps
      FROM asistencia.report_history
      WHERE EXTRACT(MONTH FROM generated_at) = ${previousMonth}
        AND EXTRACT(YEAR FROM generated_at) = ${previousYear}
    `;

    return {
      active: activeRows[0]?.activos ?? '',
      previousActive: previousActiveRows[0]?.activos ?? '',
      attendance: attendanceRows[0]?.asis ?? null,
      previousAttendance: previousAttendanceRows[0]?.asis ?? null,
      late: lateRows[0]?.tard ?? '',
      previousLate: previousLateRows[0]?.tard ?? '',
      incidents: incidentRows[0]?.inc ?? '',
      previousIncidents: previousIncidentRows[0]?.inc ?? '',
      absences: absenceRows[0]?.aus ?? '',
      previousAbsences: previousAbsenceRows[0]?.aus ?? '',
      reports: reportRows[0]?.reps ?? '',
      previousReports: previousReportRows[0]?.reps ?? '',
    };
  }

  async getTrend(): Promise<TrendRow[]> {
    return prisma.$queryRaw<TrendRow[]>`
      SELECT
        EXTRACT(MONTH FROM date)::text AS mes,
        EXTRACT(YEAR FROM date)::text AS anio,
        ROUND(SUM((status != 'absent')::int)::numeric / NULLIF(COUNT(*), 0) * 100, 1)::text AS porcentaje
      FROM asistencia.attendances
      WHERE date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '6 months')
        AND date <= (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')${roleFilterByUserId('user_id')}
      GROUP BY EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date)
      ORDER BY EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date)
      LIMIT 6
    `;
  }

  async getAttendance(filters: AttendanceFilters): Promise<AttendanceRecord[]> {
    const conditions: Prisma.Sql[] = [];
    if (filters.fecha_desde) {
      conditions.push(Prisma.sql`AND a.date >= ${filters.fecha_desde}::date`);
    }
    if (filters.fecha_hasta) {
      conditions.push(Prisma.sql`AND a.date <= ${filters.fecha_hasta}::date`);
    }
    if (filters.empleado_id) {
      conditions.push(Prisma.sql`AND a.user_id = ${filters.empleado_id}`);
    }
    if (filters.area_id) {
      conditions.push(Prisma.sql`AND e.area_id = ${filters.area_id}`);
    }
    if (filters.estado) {
      conditions.push(Prisma.sql`AND a.status = ${filters.estado}`);
    }

    return prisma.$queryRaw<AttendanceRecord[]>(Prisma.sql`
      SELECT
        a.id,
        COALESCE(dd.document_number, '') AS cedula,
        TRIM(CONCAT(e.first_name, ' ', e.first_surname)) AS empleado,
        COALESCE(ar.name, '') AS area,
        COALESCE(fl.name, '') AS piso,
        TO_CHAR(a.date, 'YYYY-MM-DD') AS fecha,
        TO_CHAR(a.entry_timestamp, 'HH24:MI') AS entrada1,
        TO_CHAR(a.morning_departure_timestamp, 'HH24:MI') AS salida1,
        TO_CHAR(a.afternoon_entry_timestamp, 'HH24:MI') AS entrada2,
        TO_CHAR(a.departure_timestamp, 'HH24:MI') AS salida2,
        COALESCE(a.worked_hours, 0)::text AS horas_trabajadas,
        COALESCE(a.extra_hours, 0)::text AS horas_extra,
        COALESCE(a.late_minutes, 0) AS minutos_tardanza,
        COALESCE(a.mark_type, 'Web') AS tipo_marcacion,
        COALESCE(a.status, 'on_time') AS estado,
        a.observation AS observacion
      FROM asistencia.attendances a
      JOIN asistencia.users e ON a.user_id = e.id
      LEFT JOIN asistencia.document_details dd ON dd.user_id = e.id
      LEFT JOIN asistencia.areas ar ON e.area_id = ar.id
      LEFT JOIN asistencia.floors fl ON ar.floor_id = fl.id${roleJoin('e.id')}
      WHERE 1=1${roleFilterByName('r')}
      ${Prisma.join(conditions, ' ')}
      ORDER BY a.date DESC, e.first_surname
    `);
  }

  async getIncidents(filters: IncidentFilters): Promise<IncidentRecord[]> {
    const conditions: Prisma.Sql[] = [];
    if (filters.fecha_desde) {
      conditions.push(Prisma.sql`AND DATE(i.created_at) >= ${filters.fecha_desde}`);
    }
    if (filters.fecha_hasta) {
      conditions.push(Prisma.sql`AND DATE(i.created_at) <= ${filters.fecha_hasta}`);
    }
    if (filters.estado) {
      conditions.push(Prisma.sql`AND LOWER(i.status) = LOWER(${filters.estado})`);
    }
    if (filters.tipo) {
      conditions.push(Prisma.sql`AND LOWER(i.type) = LOWER(${filters.tipo})`);
    }
    if (filters.area_id) {
      conditions.push(Prisma.sql`AND e.area_id = ${filters.area_id}`);
    }

    return prisma.$queryRaw<IncidentRecord[]>(Prisma.sql`
      SELECT
        i.id,
        i.type AS tipo,
        i.description AS descripcion,
        i.evidence AS evidencia_url,
        i.status AS estado,
        TO_CHAR(i.created_at, 'YYYY-MM-DD') AS fecha,
        TRIM(CONCAT(e.first_name, ' ', e.first_surname)) AS empleado,
        COALESCE(dd.document_number, '') AS cedula,
        COALESCE(ar.name, '') AS area,
        i.rejection_reason AS motivo_rechazo
      FROM asistencia.incidents i
      JOIN asistencia.users e ON i.user_id = e.id
      LEFT JOIN asistencia.document_details dd ON dd.user_id = e.id
      LEFT JOIN asistencia.areas ar ON e.area_id = ar.id
      WHERE 1=1${roleFilterByUserId('i.user_id')}
      ${Prisma.join(conditions, ' ')}
      ORDER BY i.created_at DESC
    `);
  }

  async getLateArrivals(filters: LateArrivalFilters): Promise<LateArrivalRecord[]> {
    const conditions: Prisma.Sql[] = [];
    if (filters.fecha_desde) {
      conditions.push(Prisma.sql`AND a.date >= ${filters.fecha_desde}::date`);
    }
    if (filters.fecha_hasta) {
      conditions.push(Prisma.sql`AND a.date <= ${filters.fecha_hasta}::date`);
    }
    if (filters.area_id) {
      conditions.push(Prisma.sql`AND e.area_id = ${filters.area_id}`);
    }
    if (filters.empleado_id) {
      conditions.push(Prisma.sql`AND a.user_id = ${filters.empleado_id}`);
    }

    return prisma.$queryRaw<LateArrivalRecord[]>(Prisma.sql`
      SELECT
        a.id,
        COALESCE(dd.document_number, '') AS cedula,
        TRIM(CONCAT(e.first_name, ' ', e.first_surname)) AS empleado,
        COALESCE(ar.name, '') AS area,
        COALESCE(fl.name, '') AS piso,
        TO_CHAR(a.date, 'YYYY-MM-DD') AS fecha,
        TO_CHAR(a.entry_timestamp, 'HH24:MI') AS entrada1,
        TO_CHAR(a.afternoon_entry_timestamp, 'HH24:MI') AS entrada2,
        COALESCE(a.late_minutes, 0) AS minutos_tardanza,
        COALESCE(a.mark_type, 'Web') AS tipo_marcacion,
        a.observation AS observacion
      FROM asistencia.attendances a
      JOIN asistencia.users e ON a.user_id = e.id
      LEFT JOIN asistencia.document_details dd ON dd.user_id = e.id
      LEFT JOIN asistencia.areas ar ON e.area_id = ar.id
      LEFT JOIN asistencia.floors fl ON ar.floor_id = fl.id
      WHERE a.status = 'late'${roleFilterByUserId('a.user_id')}
      ${Prisma.join(conditions, ' ')}
      ORDER BY a.date DESC, a.late_minutes DESC
    `);
  }

  async getAbsences(filters: AbsenceFilters): Promise<AbsenceRecord[]> {
    const conditions: Prisma.Sql[] = [];
    if (filters.fecha_desde) {
      conditions.push(Prisma.sql`AND a.date >= ${filters.fecha_desde}::date`);
    }
    if (filters.fecha_hasta) {
      conditions.push(Prisma.sql`AND a.date <= ${filters.fecha_hasta}::date`);
    }
    if (filters.area_id) {
      conditions.push(Prisma.sql`AND e.area_id = ${filters.area_id}`);
    }
    if (filters.empleado_id) {
      conditions.push(Prisma.sql`AND a.user_id = ${filters.empleado_id}`);
    }

    return prisma.$queryRaw<AbsenceRecord[]>(Prisma.sql`
      SELECT
        a.id,
        COALESCE(dd.document_number, '') AS cedula,
        TRIM(CONCAT(e.first_name, ' ', e.first_surname)) AS empleado,
        COALESCE(ar.name, '') AS area,
        COALESCE(fl.name, '') AS piso,
        TO_CHAR(a.date, 'YYYY-MM-DD') AS fecha,
        a.status AS estado,
        a.observation AS observacion,
        COALESCE(a.mark_type, 'Web') AS tipo_marcacion
      FROM asistencia.attendances a
      JOIN asistencia.users e ON a.user_id = e.id
      LEFT JOIN asistencia.document_details dd ON dd.user_id = e.id
      LEFT JOIN asistencia.areas ar ON e.area_id = ar.id
      LEFT JOIN asistencia.floors fl ON ar.floor_id = fl.id
      WHERE a.status IN ('absent', 'justified')${roleFilterByUserId('a.user_id')}
      ${Prisma.join(conditions, ' ')}
      ORDER BY a.date DESC, e.first_surname
    `);
  }

  async getEmployeeReport(
    employeeId: string,
    month: number,
    year: number,
  ): Promise<EmployeeReportData> {
    const employeeRows = await prisma.$queryRaw<EmployeeRow[]>`
      SELECT
        e.id,
        COALESCE(dd.document_number, '') AS cedula,
        e.first_name AS nombre,
        e.first_surname AS apellido,
        COALESCE(ar.name, '') AS area,
        COALESCE(ca.name, '') AS cargo,
        TO_CHAR(e.created_at, 'YYYY-MM-DD') AS fecha_ingreso
      FROM asistencia.users e
      LEFT JOIN asistencia.document_details dd ON dd.user_id = e.id
      LEFT JOIN asistencia.areas ar ON e.area_id = ar.id
      LEFT JOIN asistencia.positions ca ON e.position_id = ca.id
      WHERE e.id = ${employeeId}${roleFilterByUserId('e.id')}
    `;
    const employee = employeeRows[0];
    if (!employee) {
      return {
        employee: undefined,
        holidays: [],
        attendanceSummary: [],
        permits: [],
        incidents: [],
        detail: [],
        detailHolidays: [],
      };
    }

    const holidays = await prisma.$queryRaw<HolidayCountRow[]>`
      SELECT COUNT(*)::text AS total
      FROM asistencia.holidays
      WHERE active = TRUE
        AND EXTRACT(MONTH FROM date) = ${month}
        AND EXTRACT(YEAR FROM date) = ${year}
        AND EXTRACT(DOW FROM date) != 0
        AND EXTRACT(DOW FROM date) != 6
    `;
    const attendanceSummary = await prisma.$queryRaw<EmployeeSummaryRow[]>`
      SELECT
        COUNT(*)::text AS total_registros,
        SUM((status = 'on_time')::int)::text AS puntuales,
        SUM((status = 'late')::int)::text AS tardanzas,
        SUM((status = 'absent')::int)::text AS ausentes,
        SUM((status = 'justified')::int)::text AS justificados,
        COALESCE(SUM(worked_hours), 0)::text AS horas_trabajadas,
        COALESCE(SUM(extra_hours), 0)::text AS horas_extra,
        COALESCE(SUM(late_minutes), 0)::text AS total_minutos_tardanza
      FROM asistencia.attendances
      WHERE user_id = ${employeeId}
        AND EXTRACT(MONTH FROM date) = ${month}
        AND EXTRACT(YEAR FROM date) = ${year}${roleFilterByUserId('user_id')}
    `;
    const permits = await prisma.$queryRaw<PermitSummaryRow[]>`
      SELECT COUNT(*)::text AS total, COALESCE(SUM(1), 0)::text AS dias_permiso
      FROM asistencia.news
      WHERE user_id = ${employeeId}
        AND status = 'approved'
        AND EXTRACT(MONTH FROM date_from) = ${month}
        AND EXTRACT(YEAR FROM date_from) = ${year}${roleFilterByUserId('user_id')}
    `;
    const incidents = await prisma.$queryRaw<IncidentSummaryRow[]>`
      SELECT COUNT(*)::text AS total, COUNT(*) FILTER (WHERE status = 'pending')::text AS pendientes
      FROM asistencia.incidents
      WHERE user_id = ${employeeId}
        AND EXTRACT(MONTH FROM created_at) = ${month}
        AND EXTRACT(YEAR FROM created_at) = ${year}${roleFilterByUserId('user_id')}
    `;
    const detail = await prisma.$queryRaw<EmployeeDetailRow[]>`
      SELECT
        TO_CHAR(a.date, 'YYYY-MM-DD') AS fecha,
        a.status AS estado,
        TO_CHAR(a.entry_timestamp, 'HH24:MI') AS entrada1,
        TO_CHAR(a.morning_departure_timestamp, 'HH24:MI') AS salida1,
        TO_CHAR(a.afternoon_entry_timestamp, 'HH24:MI') AS entrada2,
        TO_CHAR(a.departure_timestamp, 'HH24:MI') AS salida2,
        a.worked_hours::text AS horas_trabajadas,
        a.extra_hours::text AS horas_extra,
        a.late_minutes AS minutos_tardanza,
        a.observation AS observacion
      FROM asistencia.attendances a
      WHERE a.user_id = ${employeeId}
        AND EXTRACT(MONTH FROM a.date) = ${month}
        AND EXTRACT(YEAR FROM a.date) = ${year}${roleFilterByUserId('a.user_id')}
      ORDER BY a.date DESC
    `;
    const detailHolidays = await prisma.$queryRaw<HolidayRow[]>`
      SELECT TO_CHAR(date, 'YYYY-MM-DD') AS fecha, name AS nombre
      FROM asistencia.holidays
      WHERE active = TRUE
        AND EXTRACT(MONTH FROM date) = ${month}
        AND EXTRACT(YEAR FROM date) = ${year}
    `;

    return { employee, holidays, attendanceSummary, permits, incidents, detail, detailHolidays };
  }

  async getEmployees(filters: EmployeeReportFilters): Promise<EmployeeReportRecord[]> {
    const conditions: Prisma.Sql[] = [];
    if (filters.area_id) {
      conditions.push(Prisma.sql`AND e.area_id = ${filters.area_id}`);
    }
    if (filters.cargo_id) {
      conditions.push(Prisma.sql`AND e.position_id = ${filters.cargo_id}`);
    }

    return prisma.$queryRaw<EmployeeReportRecord[]>(Prisma.sql`
      SELECT
        e.id,
        COALESCE(dd.document_number, '') AS cedula,
        e.first_name AS nombre,
        e.first_surname AS apellido,
        e.email AS correo,
        COALESCE(e.phone, '') AS telefono,
        COALESCE(ar.name, '') AS area,
        COALESCE(ca.name, '') AS cargo,
        1 AS activo
      FROM asistencia.users e
      LEFT JOIN asistencia.document_details dd ON dd.user_id = e.id
      LEFT JOIN asistencia.areas ar ON e.area_id = ar.id
      LEFT JOIN asistencia.positions ca ON e.position_id = ca.id
      WHERE 1=1${roleFilterByUserId('e.id')}
      ${Prisma.join(conditions, ' ')}
      ORDER BY e.first_surname, e.first_name
    `);
  }

  async getMarkings(filters: MarkingFilters): Promise<MarkingRecord[]> {
    const conditions: Prisma.Sql[] = [];
    if (filters.fecha_desde) {
      conditions.push(Prisma.sql`AND a.date >= ${filters.fecha_desde}::date`);
    }
    if (filters.fecha_hasta) {
      conditions.push(Prisma.sql`AND a.date <= ${filters.fecha_hasta}::date`);
    }
    if (filters.empleado_id) {
      conditions.push(Prisma.sql`AND a.user_id = ${filters.empleado_id}`);
    }
    if (filters.area_id) {
      conditions.push(Prisma.sql`AND e.area_id = ${filters.area_id}`);
    }

    return prisma.$queryRaw<MarkingRecord[]>(Prisma.sql`
      SELECT
        a.id,
        COALESCE(dd.document_number, '') AS cedula,
        TRIM(CONCAT(e.first_name, ' ', e.first_surname)) AS empleado,
        COALESCE(ar.name, '') AS area,
        TO_CHAR(a.date, 'YYYY-MM-DD') AS fecha,
        TO_CHAR(a.entry_timestamp, 'HH24:MI') AS entrada1,
        TO_CHAR(a.morning_departure_timestamp, 'HH24:MI') AS salida1,
        TO_CHAR(a.afternoon_entry_timestamp, 'HH24:MI') AS entrada2,
        TO_CHAR(a.departure_timestamp, 'HH24:MI') AS salida2,
        COALESCE(a.worked_hours, 0)::text AS horas_trabajadas,
        COALESCE(a.extra_hours, 0)::text AS horas_extra,
        COALESCE(a.late_minutes, 0) AS minutos_tardanza,
        COALESCE(a.mark_type, 'Web') AS tipo_marcacion,
        COALESCE(a.status, 'on_time') AS estado
      FROM asistencia.attendances a
      JOIN asistencia.users e ON a.user_id = e.id
      LEFT JOIN asistencia.document_details dd ON dd.user_id = e.id
      LEFT JOIN asistencia.areas ar ON e.area_id = ar.id
      WHERE 1=1${roleFilterByUserId('a.user_id')}
      ${Prisma.join(conditions, ' ')}
      ORDER BY a.date DESC, a.entry_timestamp DESC
    `);
  }

  async getAreas(filters: AreaReportFilters): Promise<AreaReportRecord[]> {
    const targetId = filters.usuario_id || filters.empleado_id;
    const joinConditions: Prisma.Sql[] = [];
    if (filters.mes) {
      joinConditions.push(Prisma.sql`EXTRACT(MONTH FROM a.date) = ${filters.mes}`);
    }
    if (filters.anio) {
      joinConditions.push(Prisma.sql`EXTRACT(YEAR FROM a.date) = ${filters.anio}`);
    }
    const havingByStatus: Record<string, string> = {
      on_time: "COUNT(*) FILTER (WHERE a.status = 'late') = 0 AND COUNT(*) FILTER (WHERE a.status = 'on_time') > 0",
      late: "COUNT(*) FILTER (WHERE a.status = 'late') > 0",
      absent: "COUNT(*) FILTER (WHERE a.status = 'absent') > 0",
      justified: "COUNT(*) FILTER (WHERE a.status = 'justified') > 0",
    };
    const having = filters.estado ? havingByStatus[String(filters.estado)] : undefined;

    return prisma.$queryRaw<AreaReportRecord[]>(Prisma.sql`
      SELECT
        u.id,
        CONCAT(u.first_name, ' ', u.first_surname) AS empleado,
        dd.document_number AS cedula,
        ar.name AS area,
        (COUNT(DISTINCT a.date) FILTER (WHERE a.status IN ('on_time', 'late')))::int AS dias_laborados,
        (COUNT(*) FILTER (WHERE a.status = 'on_time'))::int AS puntuales,
        (COUNT(*) FILTER (WHERE a.status = 'late'))::int AS tardanzas,
        (COUNT(*) FILTER (WHERE a.status = 'absent'))::int AS ausencias,
        COALESCE(SUM(a.worked_hours), 0)::float AS horas_trabajadas
      FROM asistencia.users u
      LEFT JOIN asistencia.areas ar ON u.area_id = ar.id
      LEFT JOIN asistencia.document_details dd ON dd.user_id = u.id
      LEFT JOIN asistencia.attendances a ON a.user_id = u.id${roleJoin('u.id')}
      ${
        joinConditions.length > 0
          ? Prisma.sql` AND ${Prisma.join(joinConditions, ' AND ')}`
          : Prisma.empty
      }
      WHERE u.active = true${roleFilterByName('r')}
      ${filters.area_id ? Prisma.sql`AND u.area_id = ${filters.area_id}` : Prisma.empty}
      ${targetId ? Prisma.sql`AND u.id = ${targetId}` : Prisma.empty}
      GROUP BY u.id, u.first_name, u.first_surname, dd.document_number, ar.name
      ${having ? Prisma.sql` HAVING ${Prisma.raw(having)}` : Prisma.empty}
      ORDER BY u.first_surname, u.first_name
    `);
  }

  async getHistory(): Promise<HistoryRow[]> {
    return prisma.$queryRaw<HistoryRow[]>`
      SELECT
        id,
        report_type AS tipo_reporte,
        user_name AS usuario_nombre,
        generated_at AS fecha_generacion,
        format AS formato,
        filters AS filtros,
        total_records AS total_registros
      FROM asistencia.report_history
      ORDER BY generated_at DESC
      LIMIT 20
    `;
  }

  async saveHistory(command: SaveHistoryCommand): Promise<void> {
    await prisma.$executeRaw`
      INSERT INTO asistencia.report_history
        (report_type, user_name, format, filters, total_records)
      VALUES
        (${command.type}, ${command.userName}, ${command.format}, ${command.filters}, ${command.totalRecords})
    `;
  }
}
