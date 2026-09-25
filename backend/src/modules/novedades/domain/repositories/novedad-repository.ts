import type {
  ActualizarNovedadData,
  CrearNovedadData,
  NovedadRow,
  ResultadoCrearNovedad,
} from '@modules/novedades/domain/entities/novedad';

export interface NovedadRepository {
  obtenerTodos(): Promise<NovedadRow[]>;
  obtenerPorEmpleado(empleadoId: string): Promise<NovedadRow[]>;
  crear(data: CrearNovedadData, usuarioId: string | null): Promise<ResultadoCrearNovedad>;
  actualizar(id: string, data: ActualizarNovedadData, usuarioId: string | null): Promise<void>;
  eliminar(id: string): Promise<void>;
}