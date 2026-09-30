import type { PdfRepository } from '@modules/pdf/domain/repositories/pdf-repository';
import type { AusenciaRow } from '@modules/pdf/domain/entities/pdf';

export interface GetAusenciasPdfFilters {
  fecha_desde?: string;
  fecha_hasta?: string;
  area_id?: string;
  empleado_id?: string;
}

export class GetAusenciasPdfHandler {
  constructor(private readonly pdfRepository: PdfRepository) {}

  async handle(filters: GetAusenciasPdfFilters): Promise<AusenciaRow[]> {
    return this.pdfRepository.getAusencias(filters);
  }
}