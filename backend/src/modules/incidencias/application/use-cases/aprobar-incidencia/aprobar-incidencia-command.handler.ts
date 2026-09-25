import type { IncidenciaRepository } from '../../../domain/repositories/incidencia-repository';

export class AprobarIncidenciaCommandHandler {
  constructor(private readonly incidenciaRepository: IncidenciaRepository) {}

  async handle({ id, revisadoPor, observacion }: { id: string; revisadoPor: string; observacion: string }): Promise<boolean> {
    return this.incidenciaRepository.aprobar(id, revisadoPor, observacion);
  }
}