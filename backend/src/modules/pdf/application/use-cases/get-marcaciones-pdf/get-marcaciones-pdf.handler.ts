import type { PdfRepository } from '@modules/pdf/domain/repositories/pdf-repository';
import type { MarcacionRow } from '@modules/pdf/domain/entities/pdf';

export interface GetMarcacionesPdfFilters {
  fecha_desde?: string;
  fecha_hasta?: string;
  empleado_id?: string;
  area_id?: string;
}

export class GetMarcacionesPdfHandler {
  constructor(private readonly pdfRepository: PdfRepository) {}

  async handle(filters: GetMarcacionesPdfFilters): Promise<MarcacionRow[]> {
    return this.pdfRepository.getMarcaciones(filters);
  }
}