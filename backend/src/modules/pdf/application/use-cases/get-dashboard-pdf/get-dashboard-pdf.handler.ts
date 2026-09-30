import type { PdfRepository } from '@modules/pdf/domain/repositories/pdf-repository';
import type { DashboardIndicadores, DashboardAsistenciaHoy } from '@modules/pdf/domain/entities/pdf';

export interface DashboardData {
  indicadores: DashboardIndicadores;
  asistenciaHoy: DashboardAsistenciaHoy[];
}

export class GetDashboardPdfHandler {
  constructor(private readonly pdfRepository: PdfRepository) {}

  async handle(): Promise<DashboardData> {
    const [indicadores, asistenciaHoy] = await Promise.all([
      this.pdfRepository.getDashboardIndicadores(),
      this.pdfRepository.getDashboardAsistenciaHoy(),
    ]);
    return { indicadores, asistenciaHoy };
  }
}