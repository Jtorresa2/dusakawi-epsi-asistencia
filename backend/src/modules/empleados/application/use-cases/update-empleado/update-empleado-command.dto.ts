import type { ActualizarEmpleadoData } from '@modules/empleados/domain/entities/empleado';

export interface UpdateEmpleadoCommandDto {
  id: string;
  data: ActualizarEmpleadoData;
}