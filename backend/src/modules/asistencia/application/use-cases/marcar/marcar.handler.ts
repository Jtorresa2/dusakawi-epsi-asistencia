import type { AsistenciaRepository } from '../../../domain/repositories/asistencia-repository';
import type { DatosMarcar, ResultadoMarcar } from '../../../domain/entities/asistencia';
import { calculateAttendanceMetrics } from '../../services/asistencia-rules';

export class MarcarHandler {
  constructor(private readonly asistenciaRepository: AsistenciaRepository) {}

  async handle(datos: DatosMarcar): Promise<ResultadoMarcar> {
    const empleado_id = datos.empleado_id;

    const now = new Date();
    const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const existing = await this.asistenciaRepository.obtenerExistenteParaMarcar(empleado_id, localDate);

    let tipo_casilla = 'entry_timestamp';
    let recordId: string;

    if (!existing) {
      const hour = now.getHours();
      let state = 'on_time';
      let lateness = 0;
      if (hour < 13) {
        tipo_casilla = 'entry_timestamp';
        const diff = (hour * 60 + now.getMinutes()) - 480;
        if (diff > 15) {
          state = 'late';
          lateness = diff;
        }
      } else {
        tipo_casilla = 'afternoon_entry_timestamp';
        const diff = (hour * 60 + now.getMinutes()) - 840;
        if (diff > 15) {
          state = 'late';
          lateness = diff;
        }
      }

      recordId = await this.asistenciaRepository.insertarMarcacion({
        empleado_id,
        localDate,
        tipo_casilla,
        hora: currentTimeStr,
        estado: state,
        late_minutes: lateness,
      });
    } else {
      const rec = existing;
      recordId = rec.id;

      if (!rec.entry_timestamp) {
        tipo_casilla = 'entry_timestamp';
      } else if (!rec.morning_departure_timestamp && now.getHours() < 14) {
        tipo_casilla = 'morning_departure_timestamp';
      } else if (!rec.afternoon_entry_timestamp && now.getHours() < 16) {
        tipo_casilla = 'afternoon_entry_timestamp';
      } else if (!rec.departure_timestamp) {
        tipo_casilla = 'departure_timestamp';
      } else {
        return { tipo: 'completadas' };
      }

      await this.asistenciaRepository.actualizarCasillaMarcacion(recordId, tipo_casilla, currentTimeStr);

      const updatedRec = await this.asistenciaRepository.obtenerPorId(recordId);
      if (updatedRec) {
        const uRec = updatedRec;
        // FIX AUTORIZADO: timeToMinutes acepta Date (timestamptz), el bug
        // heredado 't.split is not a function' quedó resuelto en las reglas.
        const metrics = calculateAttendanceMetrics(
          uRec.entry_timestamp,
          uRec.morning_departure_timestamp,
          uRec.afternoon_entry_timestamp,
          uRec.departure_timestamp
        );
        await this.asistenciaRepository.actualizarMetricas(
          recordId,
          metrics.horas_trabajadas,
          metrics.minutos_tardanza
        );
      }
    }

    return {
      tipo: 'ok',
      mensaje: 'Marcación registrada con éxito',
      id: recordId,
      casilla: tipo_casilla,
      hora: currentTimeStr.substring(0, 5),
    };
  }
}
