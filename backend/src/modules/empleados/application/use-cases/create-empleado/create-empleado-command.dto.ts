import type { CrearEmpleadoData } from '@modules/empleados/domain/entities/empleado';

export interface CreateEmpleadoCommandDto {
  data: CrearEmpleadoData;
}