import type { PdfRepository } from '@modules/pdf/domain/repositories/pdf-repository';
import type { EmpleadoRow } from '@modules/pdf/domain/entities/pdf';

export interface GetEmpleadosPdfFilters {
  area_id?: string;
  cargo_id?: string;
}

export class GetEmpleadosPdfHandler {
  constructor(private readonly pdfRepository: PdfRepository) {}

  async handle(filters: GetEmpleadosPdfFilters): Promise<EmpleadoRow[]> {
    return this.pdfRepository.getEmpleados(filters);
  }
}