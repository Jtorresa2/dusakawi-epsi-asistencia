import type { LateArrivalFilters, LateArrivalRecord } from '@modules/reportes/domain/entities/report';
import type { ReportRepository } from '@modules/reportes/domain/repositories/report-repository';

export class GetLateArrivalsReportHandler {
  constructor(private readonly reportRepository: ReportRepository) {}

  async handle(filters: LateArrivalFilters) {
    const rows = await this.reportRepository.getLateArrivals(filters);
    const records: LateArrivalRecord[] = rows;
    return { registros: records, total: rows.length };
  }
}
