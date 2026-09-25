import { displayReportStatus } from '@modules/reportes/application/services/report-status';
import type { EmployeeReportQuery } from '@modules/reportes/domain/entities/report';
import type { ReportRepository } from '@modules/reportes/domain/repositories/report-repository';

export class GetEmployeeReportHandler {
  constructor(private readonly reportRepository: ReportRepository) {}

  async handle(query: EmployeeReportQuery) {
    if (!query.employeeId) return { status: 'missing-employee' as const };

    const month = parseInt(query.month || String(new Date().getMonth() + 1), 10);
    const year = parseInt(query.year || String(new Date().getFullYear()), 10);
    const report = await this.reportRepository.getEmployeeReport(
      query.employeeId,
      month,
      year,
    );
    const employee = report.employee;
    if (!employee) return { status: 'not-found' as const };

    const daysInMonth = new Date(year, month, 0).getDate();
    let businessDays = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      if (date.getDay() !== 0 && date.getDay() !== 6) businessDays++;
    }

    const totalHolidays = Number(report.holidays[0]?.total || 0);
    const expectedDays = Math.max(businessDays - totalHolidays, 1);
    const attendanceSummary = report.attendanceSummary[0] || {
      total_registros: 0,
      puntuales: 0,
      tardanzas: 0,
      ausentes: 0,
      justificados: 0,
      horas_trabajadas: 0,
      horas_extra: 0,
      total_minutos_tardanza: 0,
    };
    const holidayNames = Object.fromEntries(
      report.detailHolidays.map((holiday) => [holiday.fecha, holiday.nombre]),
    );
    const detail = report.detail.map((row) => ({
      ...row,
      estado: displayReportStatus(row.estado),
      esFestivo: Boolean(holidayNames[row.fecha]),
      festivo: holidayNames[row.fecha] || null,
    }));
    const punctualityPercentage = Math.round(
      (Number(attendanceSummary.puntuales || 0) / expectedDays) * 100,
    );

    return {
      status: 'ok' as const,
      response: {
        empleado: employee,
        periodo: {
          mes: month,
          anio: year,
          diasHabiles: businessDays,
          festivos: totalHolidays,
          diasEsperados: expectedDays,
        },
        resumen: {
          ...attendanceSummary,
          puntuales: Number(attendanceSummary.puntuales || 0),
          tardanzas: Number(attendanceSummary.tardanzas || 0),
          ausentes: Number(attendanceSummary.ausentes || 0),
          justificados: Number(attendanceSummary.justificados || 0),
          horas_trabajadas: Number(attendanceSummary.horas_trabajadas || 0),
          horas_extra: Number(attendanceSummary.horas_extra || 0),
          total_minutos_tardanza: Number(attendanceSummary.total_minutos_tardanza || 0),
          porcentaje_asistencia: Math.round(
            ((Number(attendanceSummary.puntuales || 0) +
              Number(attendanceSummary.tardanzas || 0) +
              Number(attendanceSummary.justificados || 0)) /
              expectedDays) *
              100,
          ),
          porcentaje_puntualidad: punctualityPercentage,
        },
        permisos: {
          total: Number(report.permits[0]?.total || 0),
          dias: Number(report.permits[0]?.dias_permiso || 0),
        },
        incidencias: {
          total: Number(report.incidents[0]?.total || 0),
          pendientes: Number(report.incidents[0]?.pendientes || 0),
        },
        detalle: detail,
      },
    };
  }
}
