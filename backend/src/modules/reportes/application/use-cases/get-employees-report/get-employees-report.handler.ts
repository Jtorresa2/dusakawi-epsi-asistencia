import type { EmployeeReportFilters, EmployeeReportRecord } from '@modules/reportes/domain/entities/report';
import type { ReportRepository } from '@modules/reportes/domain/repositories/report-repository';

export class GetEmployeesReportHandler {
  constructor(private readonly reportRepository: ReportRepository) {}

  async handle(filters: EmployeeReportFilters) {
    const rows = await this.reportRepository.getEmployees(filters);
    const records: EmployeeReportRecord[] = rows;
    return { registros: records, total: rows.length };
  }
}
