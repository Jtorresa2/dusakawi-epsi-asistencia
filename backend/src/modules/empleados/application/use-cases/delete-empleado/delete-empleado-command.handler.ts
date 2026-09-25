import type { EmpleadoRepository } from '@modules/empleados/domain/repositories/empleado-repository';
import type { DeleteEmpleadoCommandDto } from './delete-empleado-command.dto';

export class DeleteEmpleadoCommandHandler {
  constructor(private readonly empleadoRepository: EmpleadoRepository) {}

  async handle(command: DeleteEmpleadoCommandDto): Promise<void> {
    await this.empleadoRepository.eliminar(command.id);
  }
}