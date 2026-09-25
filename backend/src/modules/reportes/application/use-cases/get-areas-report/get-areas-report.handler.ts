import type { AreaReportFilters, AreaReportRecord } from '@modules/reportes/domain/entities/report';
import type { ReportRepository } from '@modules/reportes/domain/repositories/report-repository';

export class GetAreasReportHandler {
  constructor(private readonly reportRepository: ReportRepository) {}

  async handle(filters: AreaReportFilters) {
    const rows = await this.reportRepository.getAreas(filters);
    const records: AreaReportRecord[] = rows;
    return { registros: records, total: rows.length };
  }
}
