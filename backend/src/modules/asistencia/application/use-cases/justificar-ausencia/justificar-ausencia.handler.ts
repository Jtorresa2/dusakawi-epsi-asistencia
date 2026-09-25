import type { AsistenciaRepository } from '../../../domain/repositories/asistencia-repository';
import type {
  DatosJustificarAusencia,
  ResultadoJustificar,
} from '../../../domain/entities/asistencia';

export class JustificarAusenciaHandler {
  constructor(private readonly asistenciaRepository: AsistenciaRepository) {}

  async handle(datos: DatosJustificarAusencia): Promise<ResultadoJustificar> {
    const { id, observacion, motivo, tipo } = datos;
    const textoJustificacion = observacion || (motivo ? `${tipo ? `[${tipo}] ` : ''}${motivo}` : 'Justificado por supervisor');

    await this.asistenciaRepository.justificarAusencia(id, textoJustificacion);

    return { mensaje: 'Ausencia justificada correctamente' };
  }
}
