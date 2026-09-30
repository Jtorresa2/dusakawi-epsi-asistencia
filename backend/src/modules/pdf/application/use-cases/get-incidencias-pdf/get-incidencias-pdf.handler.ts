import type { PdfRepository } from '@modules/pdf/domain/repositories/pdf-repository';
import type { IncidenciaRow } from '@modules/pdf/domain/entities/pdf';

export interface GetIncidenciasPdfFilters {
  estado?: string;
  tipo?: string;
}

export class GetIncidenciasPdfHandler {
  constructor(private readonly pdfRepository: PdfRepository) {}

  async handle(filters: GetIncidenciasPdfFilters): Promise<IncidenciaRow[]> {
    return this.pdfRepository.getIncidencias(filters);
  }
}