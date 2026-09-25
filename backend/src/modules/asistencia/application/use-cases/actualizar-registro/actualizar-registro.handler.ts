import type { AsistenciaRepository } from '../../../domain/repositories/asistencia-repository';
import type {
  DatosActualizarRegistro,
  ResultadoActualizar,
} from '../../../domain/entities/asistencia';
import { calculateAttendanceMetrics, statusFromDB } from '../../services/asistencia-rules';

export class ActualizarRegistroHandler {
  constructor(private readonly asistenciaRepository: AsistenciaRepository) {}

  async handle(datos: DatosActualizarRegistro): Promise<ResultadoActualizar> {
    const { id, entrada1, salida1, entrada2, salida2, fecha, tipo_marcacion, estado, observacion } = datos;

    const t_e1 = entrada1 ? (entrada1.length === 5 ? `${entrada1}:00` : entrada1) : null;
    const t_s1 = salida1 ? (salida1.length === 5 ? `${salida1}:00` : salida1) : null;
    const t_e2 = entrada2 ? (entrada2.length === 5 ? `${entrada2}:00` : entrada2) : null;
    const t_s2 = salida2 ? (salida2.length === 5 ? `${salida2}:00` : salida2) : null;

    const { horas_trabajadas, minutos_tardanza } = calculateAttendanceMetrics(t_e1, t_s1, t_e2, t_s2);

    await this.asistenciaRepository.actualizarRegistro(id, {
      t_e1,
      t_s1,
      t_e2,
      t_s2,
      mark_type: tipo_marcacion || 'manual',
      status: estado ? statusFromDB(estado) : 'on_time',
      observacion: observacion ?? null,
      horas_trabajadas,
      minutos_tardanza,
      fecha,
    });

    return { mensaje: 'Registro actualizado correctamente' };
  }
}