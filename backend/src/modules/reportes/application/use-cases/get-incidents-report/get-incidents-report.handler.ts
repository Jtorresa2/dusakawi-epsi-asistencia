import { displayIncidentStatus } from '@modules/reportes/application/services/report-status';
import type { IncidentFilters, IncidentRecord } from '@modules/reportes/domain/entities/report';
import type { ReportRepository } from '@modules/reportes/domain/repositories/report-repository';

export class GetIncidentsReportHandler {
  constructor(private readonly reportRepository: ReportRepository) {}

  async handle(filters: IncidentFilters) {
    const rows = await this.reportRepository.getIncidents(filters);
    const records: IncidentRecord[] = rows.map((row) => ({
      ...row,
      estado: displayIncidentStatus(row.estado),
    }));
    return { registros: records, total: rows.length };
  }
}
