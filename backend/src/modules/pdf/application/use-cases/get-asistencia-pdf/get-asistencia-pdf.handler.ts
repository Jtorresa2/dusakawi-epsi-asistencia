import type { PdfRepository } from '@modules/pdf/domain/repositories/pdf-repository';
import type { AsistenciaRow } from '@modules/pdf/domain/entities/pdf';

export interface GetAsistenciaPdfFilters {
  fecha?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  area?: string;
  piso?: string;
  estado?: string;
  empleado_id?: string;
  area_id?: string;
}

export class GetAsistenciaPdfHandler {
  constructor(private readonly pdfRepository: PdfRepository) {}

  async handle(filters: GetAsistenciaPdfFilters): Promise<AsistenciaRow[]> {
    return this.pdfRepository.getAsistencia(filters);
  }
}