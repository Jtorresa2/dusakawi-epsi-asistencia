import type { PdfRepository } from '@modules/pdf/domain/repositories/pdf-repository';
import type { TardanzaRow } from '@modules/pdf/domain/entities/pdf';

export interface GetTardanzasPdfFilters {
  fecha_desde?: string;
  fecha_hasta?: string;
  area_id?: string;
  empleado_id?: string;
}

export class GetTardanzasPdfHandler {
  constructor(private readonly pdfRepository: PdfRepository) {}

  async handle(filters: GetTardanzasPdfFilters): Promise<TardanzaRow[]> {
    return this.pdfRepository.getTardanzas(filters);
  }
}