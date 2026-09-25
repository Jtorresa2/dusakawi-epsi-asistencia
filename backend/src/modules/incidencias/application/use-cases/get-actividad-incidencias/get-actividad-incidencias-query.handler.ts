import type { ActividadIncidenciaRow } from '../../../domain/entities/incidencia';
import type { IncidenciaRepository } from '../../../domain/repositories/incidencia-repository';

export class GetActividadIncidenciasQueryHandler {
  constructor(private readonly incidenciaRepository: IncidenciaRepository) {}

  async handle(): Promise<ActividadIncidenciaRow[]> {
    return this.incidenciaRepository.obtenerActividad();
  }
}