import type {
  ActividadIncidenciaRow,
  CrearIncidenciaData,
  FiltrosIncidencia,
  IncidenciaRow,
  StatsIncidencia,
} from '../entities/incidencia';

export interface IncidenciaRepository {
  obtenerTodas(filtros: FiltrosIncidencia): Promise<IncidenciaRow[]>;
  obtenerPorId(id: string): Promise<IncidenciaRow | null>;
  crear(data: CrearIncidenciaData): Promise<string>;
  aprobar(id: string, revisadoPor: string, observacion: string): Promise<boolean>;
  aprobarConFirma(id: string, archivoFirmado: string, revisadoPor: string): Promise<boolean>;
  rechazar(id: string, motivo: string, revisadoPor: string): Promise<boolean>;
  solicitarCorreccion(id: string, observacion: string, revisadoPor: string): Promise<boolean>;
  eliminar(id: string): Promise<void>;
  obtenerStats(): Promise<StatsIncidencia>;
  obtenerActividad(): Promise<ActividadIncidenciaRow[]>;
  obtenerAsistenciaRelacionada(userId: string, fecha: string): Promise<Record<string, unknown> | null>;
}