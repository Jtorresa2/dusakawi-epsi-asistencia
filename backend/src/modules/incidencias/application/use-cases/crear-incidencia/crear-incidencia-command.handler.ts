import type { CrearIncidenciaData } from '../../../domain/entities/incidencia';
import type { IncidenciaRepository } from '../../../domain/repositories/incidencia-repository';

export class CrearIncidenciaCommandHandler {
  constructor(private readonly incidenciaRepository: IncidenciaRepository) {}

  async handle({ data }: { data: CrearIncidenciaData }): Promise<{ id: string }> {
    const id = await this.incidenciaRepository.crear(data);
    return { id };
  }
}