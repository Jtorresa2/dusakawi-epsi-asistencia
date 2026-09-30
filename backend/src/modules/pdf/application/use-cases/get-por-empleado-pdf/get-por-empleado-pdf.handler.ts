import type { PdfRepository } from '@modules/pdf/domain/repositories/pdf-repository';
import type { PorEmpleadoData } from '@modules/pdf/domain/entities/pdf';

export interface GetPorEmpleadoPdfFilters {
  empleado_id?: string;
  usuario_id?: string;
  mes?: string;
  anio?: string;
}

export class GetPorEmpleadoPdfHandler {
  constructor(private readonly pdfRepository: PdfRepository) {}

  async handle(filters: GetPorEmpleadoPdfFilters): Promise<PorEmpleadoData | null> {
    return this.pdfRepository.getPorEmpleado(filters);
  }
}