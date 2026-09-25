import type { EmpleadoRow } from '@modules/empleados/domain/entities/empleado';
import type { EmpleadoRepository } from '@modules/empleados/domain/repositories/empleado-repository';
import type { GetEmpleadoQueryDto } from './get-empleado-query.dto';

export class GetEmpleadoQueryHandler {
  constructor(private readonly empleadoRepository: EmpleadoRepository) {}

  async handle(request: GetEmpleadoQueryDto): Promise<EmpleadoRow | null> {
    return this.empleadoRepository.obtenerPorId(request.id);
  }
}