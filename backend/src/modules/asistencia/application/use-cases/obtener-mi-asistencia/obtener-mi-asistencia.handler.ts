import type { AsistenciaRepository } from '../../../domain/repositories/asistencia-repository';
import type {
  ConsultaMiAsistencia,
  ResultadoMiAsistencia,
} from '../../../domain/entities/asistencia';
import { statusDisplay } from '../../services/asistencia-rules';

export class ObtenerMiAsistenciaHandler {
  constructor(private readonly asistenciaRepository: AsistenciaRepository) {}

  async handle(consulta: ConsultaMiAsistencia): Promise<ResultadoMiAsistencia> {
    const { mes, anio, empleado_id } = consulta;

    const rows = await this.asistenciaRepository.obtenerMiAsistencia(empleado_id, mes, anio);

    const registros = rows.map((r) => {
      const rawState = statusDisplay(r.estado);
      const capitalized = rawState.charAt(0).toUpperCase() + rawState.slice(1);
      return {
        id: r.id,
        fecha: r.fecha,
        entrada1: r.entrada1,
        salida1: r.salida1,
        entrada2: r.entrada2,
        salida2: r.salida2,
        horas: r.horas_trabajadas,
        estado: capitalized,
        dia_semana: r.dia_semana,
        observacion: r.observacion,
      };
    });

    return { registros };
  }
}
