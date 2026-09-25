import type { AsistenciaRepository } from '../../../domain/repositories/asistencia-repository';
import type { ResultadoEliminar } from '../../../domain/entities/asistencia';

export class EliminarRegistroHandler {
  constructor(private readonly asistenciaRepository: AsistenciaRepository) {}

  async handle({ id }: { id: string }): Promise<ResultadoEliminar> {
    await this.asistenciaRepository.eliminar(id);
    return { mensaje: 'Registro eliminado correctamente' };
  }
}