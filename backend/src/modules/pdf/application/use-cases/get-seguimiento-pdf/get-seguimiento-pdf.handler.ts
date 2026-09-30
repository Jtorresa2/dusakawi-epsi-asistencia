import type { PdfRepository } from '@modules/pdf/domain/repositories/pdf-repository';
import type { SeguimientoFiltros, SeguimientoResult } from '@modules/pdf/domain/entities/pdf';

export class GetSeguimientoPdfHandler {
  constructor(private readonly pdfRepository: PdfRepository) {}

  async handle(filtros: SeguimientoFiltros): Promise<SeguimientoResult> {
    return this.pdfRepository.getSeguimiento(filtros);
  }
}