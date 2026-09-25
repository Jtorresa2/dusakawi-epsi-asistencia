import type { IncidenciaRow } from '../../../domain/entities/incidencia';
import type { IncidenciaRepository } from '../../../domain/repositories/incidencia-repository';

export class GetIncidenciaPorIdQueryHandler {
  constructor(private readonly incidenciaRepository: IncidenciaRepository) {}

  async handle({ id }: { id: string }): Promise<IncidenciaRow | null> {
    const incidencia = await this.incidenciaRepository.obtenerPorId(id);
    if (!incidencia) return null;
    // Réplica del legacy: la incidencia trae su asistencia relacionada (si el
    // query puede resolverse; de lo contrario null, igual que el try/catch).
    incidencia.asistencia = await this.incidenciaRepository.obtenerAsistenciaRelacionada(
      incidencia.user_id,
      incidencia.fecha
    );
    return incidencia;
  }
}