import type { IncidenciaRepository } from '../../../domain/repositories/incidencia-repository';

export class AprobarIncidenciaConFirmaCommandHandler {
  constructor(private readonly incidenciaRepository: IncidenciaRepository) {}

  async handle({ id, archivoFirmado, revisadoPor }: { id: string; archivoFirmado: string; revisadoPor: string }): Promise<boolean> {
    return this.incidenciaRepository.aprobarConFirma(id, archivoFirmado, revisadoPor);
  }
}