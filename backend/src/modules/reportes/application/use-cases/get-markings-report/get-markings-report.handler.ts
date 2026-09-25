import { displayReportStatus } from '@modules/reportes/application/services/report-status';
import type { MarkingFilters, MarkingRecord } from '@modules/reportes/domain/entities/report';
import type { ReportRepository } from '@modules/reportes/domain/repositories/report-repository';

export class GetMarkingsReportHandler {
  constructor(private readonly reportRepository: ReportRepository) {}

  async handle(filters: MarkingFilters) {
    const rows = await this.reportRepository.getMarkings(filters);
    const records: MarkingRecord[] = rows.map((row) => ({
      ...row,
      estado: displayReportStatus(row.estado),
    }));
    return { registros: records, total: rows.length };
  }
}
