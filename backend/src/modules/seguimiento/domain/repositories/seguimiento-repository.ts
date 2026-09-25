import type {
  IncidenciaVinculoRow,
  NovedadVinculoRow,
} from '../entities/seguimiento';
import type { FilaUniversoSeguimiento } from '../entities/seguimiento';

export interface SeguimientoRepository {
  /** Universo (usuario, fecha) laboral de la ventana + marcas + horario esperado. */
  consultarUniverso(filtros: {
    fecha_desde: string;
    fecha_hasta: string;
    area?: string;
    piso?: string;
    busqueda?: string;
  }): Promise<FilaUniversoSeguimiento[]>;

  /** Novedades aprobadas en la ventana (agrupadas por usuario en el servicio). */
  consultarNovedades(fechaDesde: string, fechaHasta: string): Promise<NovedadVinculoRow[]>;

  /** Incidencias vinculables en la ventana (solo tipos relevantes). */
  consultarIncidencias(fechaDesde: string, fechaHasta: string): Promise<IncidenciaVinculoRow[]>;
}