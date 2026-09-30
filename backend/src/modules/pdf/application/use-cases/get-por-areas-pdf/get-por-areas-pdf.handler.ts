import type { PdfRepository } from '@modules/pdf/domain/repositories/pdf-repository';
import type { PorAreasRow } from '@modules/pdf/domain/entities/pdf';

export interface GetPorAreasPdfFilters {
  area_id?: string;
  empleado_id?: string;
  usuario_id?: string;
  mes?: string;
  anio?: string;
  estado?: string;
}

export class GetPorAreasPdfHandler {
  constructor(private readonly pdfRepository: PdfRepository) {}

  async handle(filters: GetPorAreasPdfFilters): Promise<PorAreasRow[]> {
    return this.pdfRepository.getPorAreas(filters);
  }
}