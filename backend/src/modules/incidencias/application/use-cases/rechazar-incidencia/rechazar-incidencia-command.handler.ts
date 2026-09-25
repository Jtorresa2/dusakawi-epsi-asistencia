import type { IncidenciaRepository } from '../../../domain/repositories/incidencia-repository';

export class RechazarIncidenciaCommandHandler {
  constructor(private readonly incidenciaRepository: IncidenciaRepository) {}

  async handle({ id, motivo, revisadoPor }: { id: string; motivo: string; revisadoPor: string }): Promise<boolean> {
    return this.incidenciaRepository.rechazar(id, motivo, revisadoPor);
  }
}