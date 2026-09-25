import type { EmpleadoRepository } from '@modules/empleados/domain/repositories/empleado-repository';
import type { CreateEmpleadoCommandDto } from './create-empleado-command.dto';

export interface CreateEmpleadoCommandResult {
  id: string;
}

export class CreateEmpleadoCommandHandler {
  constructor(private readonly empleadoRepository: EmpleadoRepository) {}

  async handle(command: CreateEmpleadoCommandDto): Promise<CreateEmpleadoCommandResult> {
    const id = await this.empleadoRepository.crear(command.data);
    return { id };
  }
}