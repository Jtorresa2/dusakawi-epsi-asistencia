import type { EmpleadoRow } from '@modules/empleados/domain/entities/empleado';
import type { EmpleadoRepository } from '@modules/empleados/domain/repositories/empleado-repository';
import type { GetEmpleadosQueryDto } from './get-empleados-query.dto';

export class GetEmpleadosQueryHandler {
  constructor(private readonly empleadoRepository: EmpleadoRepository) {}

  async handle(request: GetEmpleadosQueryDto): Promise<EmpleadoRow[]> {
    return this.empleadoRepository.obtenerTodos(request);
  }
}