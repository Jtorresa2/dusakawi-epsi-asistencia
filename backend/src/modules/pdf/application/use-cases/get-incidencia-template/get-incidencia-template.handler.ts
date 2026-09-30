import type { PdfRepository } from '@modules/pdf/domain/repositories/pdf-repository';
import type { IncidenciaPlantillaData } from '@modules/pdf/domain/entities/pdf';

export class GetIncidenciaTemplateHandler {
  constructor(private readonly pdfRepository: PdfRepository) {}

  async handle(id: string): Promise<IncidenciaPlantillaData | null> {
    return this.pdfRepository.getIncidenciaPlantilla(id);
  }
}