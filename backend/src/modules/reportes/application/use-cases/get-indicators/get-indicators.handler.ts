import type { ReportRepository } from '@modules/reportes/domain/repositories/report-repository';

export class GetIndicatorsHandler {
  constructor(private readonly reportRepository: ReportRepository) {}

  async handle(
    month: number,
    year: number,
    previousMonth: number,
    previousYear: number,
  ) {
    const data = await this.reportRepository.getIndicators(
      month,
      year,
      previousMonth,
      previousYear,
    );
    const active = Number(data.active);
    const previousActive = Number(data.previousActive) || active;
    const attendance = Number(data.attendance) || 0;
    const previousAttendance = Number(data.previousAttendance) || 0;
    const late = Number(data.late) || 0;
    const previousLate = Number(data.previousLate) || late;
    const incidents = Number(data.incidents) || 0;
    const previousIncidents = Number(data.previousIncidents) || incidents;
    const absences = Number(data.absences) || 0;
    const previousAbsences = Number(data.previousAbsences) || absences;
    const reports = Number(data.reports) || 0;
    const previousReports = Number(data.previousReports) || reports;

    return {
      empleados_activos: {
        valor: active,
        variacion: active - previousActive,
      },
      asistencia_mes: {
        valor: attendance,
        variacion: +((Number(attendance || 0) - Number(previousAttendance || 0)).toFixed(1)),
      },
      tardanzas_mes: {
        valor: late,
        variacion: late - previousLate,
      },
      incidencias_abiertas: {
        valor: incidents,
        variacion: incidents - previousIncidents,
      },
      ausencias_mes: {
        valor: absences,
        variacion: absences - previousAbsences,
      },
      reportes_mes: {
        valor: reports,
        variacion: reports - previousReports,
      },
    };
  }
}
