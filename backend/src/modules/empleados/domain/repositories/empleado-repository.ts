import type { ActualizarEmpleadoData, CrearEmpleadoData, EmpleadoFiltros, EmpleadoRow } from '@modules/empleados/domain/entities/empleado';

export interface EmpleadoRepository {
  obtenerTodos(filtros: EmpleadoFiltros): Promise<EmpleadoRow[]>;
  obtenerPorId(id: string): Promise<EmpleadoRow | null>;
  crear(data: CrearEmpleadoData): Promise<string>;
  actualizar(id: string, data: ActualizarEmpleadoData): Promise<void>;
  eliminar(id: string): Promise<void>;
}