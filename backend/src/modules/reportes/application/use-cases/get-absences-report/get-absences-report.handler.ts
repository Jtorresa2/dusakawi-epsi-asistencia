import { displayReportStatus } from '@modules/reportes/application/services/report-status';
import type { AbsenceFilters, AbsenceRecord } from '@modules/reportes/domain/entities/report';
import type { ReportRepository } from '@modules/reportes/domain/repositories/report-repository';

export class GetAbsencesReportHandler {
  constructor(private readonly reportRepository: ReportRepository) {}

  async handle(filters: AbsenceFilters) {
    const rows = await this.reportRepository.getAbsences(filters);
    const records: AbsenceRecord[] = rows.map((row) => ({
      ...row,
      estado: displayReportStatus(row.estado),
    }));
    return { registros: records, total: rows.length };
  }
}
