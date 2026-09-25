import type { AsistenciaRepository } from '../../../domain/repositories/asistencia-repository';
import type { FiltrosRegistros, ResultadoRegistros } from '../../../domain/entities/asistencia';
import { statusDisplay } from '../../services/asistencia-rules';

export class ObtenerRegistrosHandler {
  constructor(private readonly asistenciaRepository: AsistenciaRepository) {}

  async handle(filtros: FiltrosRegistros): Promise<ResultadoRegistros> {
    const rows = await this.asistenciaRepository.obtenerRegistros(filtros);
    const registros = rows.map((r) => ({ ...r, estado: statusDisplay(r.estado) }));
    return { registros };
  }
}
