import type { HistoryRow, ReportRecord } from '@modules/reportes/domain/entities/report';
import type { ReportRepository } from '@modules/reportes/domain/repositories/report-repository';

export class GetHistoryHandler {
  constructor(private readonly reportRepository: ReportRepository) {}

  async handle() {
    const rows: HistoryRow[] = await this.reportRepository.getHistory();
    return { historial: rows as ReportRecord[] };
  }
}
