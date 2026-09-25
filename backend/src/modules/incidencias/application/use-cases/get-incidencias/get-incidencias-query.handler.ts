import type { FiltrosIncidencia, IncidenciaRow } from '../../../domain/entities/incidencia';
import type { IncidenciaRepository } from '../../../domain/repositories/incidencia-repository';

export class GetIncidenciasQueryHandler {
  constructor(private readonly incidenciaRepository: IncidenciaRepository) {}

  async handle(filtros: FiltrosIncidencia): Promise<IncidenciaRow[]> {
    return this.incidenciaRepository.obtenerTodas(filtros);
  }
}