import type { PdfRepository } from '@modules/pdf/domain/repositories/pdf-repository';
import type { AsistenciaRow } from '@modules/pdf/domain/entities/pdf';

export class GetTestPdfHandler {
  constructor(private readonly pdfRepository: PdfRepository) {}

  async handle(): Promise<{ success: true }> {
    return { success: true };
  }
}