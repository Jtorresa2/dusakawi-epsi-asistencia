import type { StatsIncidencia } from '../../../domain/entities/incidencia';
import type { IncidenciaRepository } from '../../../domain/repositories/incidencia-repository';

export class GetStatsIncidenciasQueryHandler {
  constructor(private readonly incidenciaRepository: IncidenciaRepository) {}

  async handle(): Promise<StatsIncidencia> {
    return this.incidenciaRepository.obtenerStats();
  }
}