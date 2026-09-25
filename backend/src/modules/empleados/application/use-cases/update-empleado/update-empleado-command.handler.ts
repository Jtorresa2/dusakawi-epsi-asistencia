import type { EmpleadoRepository } from '@modules/empleados/domain/repositories/empleado-repository';
import type { UpdateEmpleadoCommandDto } from './update-empleado-command.dto';

export class UpdateEmpleadoCommandHandler {
  constructor(private readonly empleadoRepository: EmpleadoRepository) {}

  async handle(command: UpdateEmpleadoCommandDto): Promise<void> {
    await this.empleadoRepository.actualizar(command.id, command.data);
  }
}