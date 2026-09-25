import type { SeguimientoRepository } from '../../../domain/repositories/seguimiento-repository';
import { clasificar } from '../../services/seguimiento-rules';
import type { FiltrosSeguimiento, ResultadoSeguimiento } from '../../../domain/entities/seguimiento';

export class ObtenerSeguimientoQueryHandler {
  constructor(private readonly seguimientoRepository: SeguimientoRepository) {}

  async handle(filtros: FiltrosSeguimiento): Promise<ResultadoSeguimiento> {
    const fechaDesde = filtros.fecha_desde || '';
    const fechaHasta = filtros.fecha_hasta || '';

    const [filas, novedades, incidencias] = await Promise.all([
      this.seguimientoRepository.consultarUniverso({
        fecha_desde: fechaDesde,
        fecha_hasta: fechaHasta,
        area: filtros.area,
        piso: filtros.piso,
        busqueda: filtros.busqueda,
      }),
      this.seguimientoRepository.consultarNovedades(fechaDesde, fechaHasta),
      this.seguimientoRepository.consultarIncidencias(fechaDesde, fechaHasta),
    ]);

    return clasificar({ filas, novedades, incidencias, filtros });
  }
}