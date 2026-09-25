import { displayReportStatus } from '@modules/reportes/application/services/report-status';
import type { DailyRecord, DailySummary } from '@modules/reportes/domain/entities/report';
import type { ReportRepository } from '@modules/reportes/domain/repositories/report-repository';

export class GetDailyReportHandler {
  constructor(private readonly reportRepository: ReportRepository) {}

  async handle(date: string) {
    const records = await this.reportRepository.getDailyRecords(date);
    const summaryRows = await this.reportRepository.getDailySummary(date);
    const summary: Partial<DailySummary> = summaryRows[0] || {};
    const mappedRecords: DailyRecord[] = records.map((record) => ({
      ...record,
      estado: displayReportStatus(record.estado),
    }));

    return {
      fecha: date,
      resumen: summary,
      registros: mappedRecords,
    };
  }
}
