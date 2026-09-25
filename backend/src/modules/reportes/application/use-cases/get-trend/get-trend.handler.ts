import type { ReportRepository } from '@modules/reportes/domain/repositories/report-repository';

export class GetTrendHandler {
  constructor(private readonly reportRepository: ReportRepository) {}

  async handle() {
    const rows = await this.reportRepository.getTrend();
    return { tendencia: rows };
  }
}
