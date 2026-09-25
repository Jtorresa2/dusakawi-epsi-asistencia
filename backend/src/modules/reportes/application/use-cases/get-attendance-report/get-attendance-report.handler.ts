import { displayReportStatus } from '@modules/reportes/application/services/report-status';
import type { AttendanceRecord, AttendanceFilters } from '@modules/reportes/domain/entities/report';
import type { ReportRepository } from '@modules/reportes/domain/repositories/report-repository';

export class GetAttendanceReportHandler {
  constructor(private readonly reportRepository: ReportRepository) {}

  async handle(filters: AttendanceFilters) {
    const rows = await this.reportRepository.getAttendance(filters);
    const records: AttendanceRecord[] = rows.map((row) => ({
      ...row,
      estado: displayReportStatus(row.estado),
    }));
    return { registros: records, total: rows.length };
  }
}
