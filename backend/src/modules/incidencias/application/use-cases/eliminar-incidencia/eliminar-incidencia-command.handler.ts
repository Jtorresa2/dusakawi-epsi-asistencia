import type { IncidenciaRepository } from '../../../domain/repositories/incidencia-repository';

export class EliminarIncidenciaCommandHandler {
  constructor(private readonly incidenciaRepository: IncidenciaRepository) {}

  async handle({ id }: { id: string }): Promise<void> {
    return this.incidenciaRepository.eliminar(id);
  }
}