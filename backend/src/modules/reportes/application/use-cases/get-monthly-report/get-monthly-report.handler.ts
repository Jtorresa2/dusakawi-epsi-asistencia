import type { ReportRepository } from '@modules/reportes/domain/repositories/report-repository';

export class GetMonthlyReportHandler {
  constructor(private readonly reportRepository: ReportRepository) {}

  async handle(month: number, year: number) {
    const report = await this.reportRepository.getMonthlyReport(month, year);
    const holidayDates = new Set(report.holidays.map((holiday) => holiday.fecha));
    const holidayNames = Object.fromEntries(
      report.holidays.map((holiday) => [holiday.fecha, holiday.nombre]),
    );
    const days = report.days.map((day) => ({
      ...day,
      esFestivo: holidayDates.has(day.fecha),
      festivo: holidayNames[day.fecha] || null,
    }));
    const summary = report.summary[0] || {};

    return {
      mes: month,
      anio: year,
      festivos: report.holidays.length,
      resumen: { ...summary, festivos: report.holidays.length },
      porDia: days,
      porArea: report.areas,
    };
  }
}
