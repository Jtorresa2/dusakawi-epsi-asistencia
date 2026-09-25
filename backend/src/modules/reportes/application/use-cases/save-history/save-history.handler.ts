import type { ReportRepository } from '@modules/reportes/domain/repositories/report-repository';

export interface SaveHistoryInput {
  type: unknown;
  userName: string;
  format: unknown;
  filters: unknown;
  totalRecords: unknown;
}

export class SaveHistoryHandler {
  constructor(private readonly reportRepository: ReportRepository) {}

  async handle(input: SaveHistoryInput) {
    const type = (input.type || 'General') as string;
    const userName = input.userName || 'Desconocido';
    const format = (input.format || 'PDF') as string;
    const filters = JSON.stringify(input.filters || {}) as string;
    const totalRecords = (input.totalRecords || 0) as number | string;

    await this.reportRepository.saveHistory({
      type,
      userName,
      format,
      filters,
      totalRecords,
    });

    return { mensaje: 'Historial guardado' };
  }
}
