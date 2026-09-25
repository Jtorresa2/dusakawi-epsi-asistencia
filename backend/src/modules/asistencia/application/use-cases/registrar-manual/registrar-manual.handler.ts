import type { AsistenciaRepository } from '../../../domain/repositories/asistencia-repository';
import type {
  DatosRegistroManual,
  ResultadoRegistroManual,
} from '../../../domain/entities/asistencia';
import { calculateAttendanceMetrics } from '../../services/asistencia-rules';

export class RegistrarManualHandler {
  constructor(private readonly asistenciaRepository: AsistenciaRepository) {}

  async handle(datos: DatosRegistroManual): Promise<ResultadoRegistroManual> {
    const { empleado_id, fecha, entrada1, salida1, entrada2, salida2, tipo_marcacion, observacion } = datos;

    const t_e1 = entrada1 ? (entrada1.length === 5 ? `${entrada1}:00` : entrada1) : null;
    const t_s1 = salida1 ? (salida1.length === 5 ? `${salida1}:00` : salida1) : null;
    const t_e2 = entrada2 ? (entrada2.length === 5 ? `${entrada2}:00` : entrada2) : null;
    const t_s2 = salida2 ? (salida2.length === 5 ? `${salida2}:00` : salida2) : null;

    const { horas_trabajadas, minutos_tardanza } = calculateAttendanceMetrics(t_e1, t_s1, t_e2, t_s2);
    let estado = 'on_time';
    if (!t_e1 && !t_e2) {
      estado = 'absent';
    } else if (minutos_tardanza > 0) {
      estado = 'late';
    }

    const existingId = await this.asistenciaRepository.obtenerIdPorUsuarioFecha(empleado_id, fecha);

    let id: string;
    if (existingId) {
      id = existingId;
      await this.asistenciaRepository.actualizarRegistroManual(existingId, {
        t_e1,
        t_s1,
        t_e2,
        t_s2,
        mark_type: tipo_marcacion || 'manual',
        status: estado,
        observacion: observacion || null,
        horas_trabajadas,
        minutos_tardanza,
      });
    } else {
      id = await this.asistenciaRepository.insertarRegistroManual({
        empleado_id,
        fecha,
        t_e1,
        t_s1,
        t_e2,
        t_s2,
        mark_type: tipo_marcacion || 'manual',
        status: estado,
        observacion: observacion || null,
        horas_trabajadas,
        minutos_tardanza,
      });
    }

    return { mensaje: 'Asistencia registrada correctamente', id };
  }
}
