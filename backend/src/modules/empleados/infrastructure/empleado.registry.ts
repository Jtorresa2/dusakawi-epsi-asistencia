import { asClass, type AwilixContainer } from 'awilix';
import { PrismaEmpleadoRepository } from './persistence/repositories/prisma/prisma-empleado-repository';
import { GetEmpleadosQueryHandler } from '../application/use-cases/get-empleados/get-empleados-query.handler';
import { GetEmpleadoQueryHandler } from '../application/use-cases/get-empleado/get-empleado-query.handler';
import { CreateEmpleadoCommandHandler } from '../application/use-cases/create-empleado/create-empleado-command.handler';
import { UpdateEmpleadoCommandHandler } from '../application/use-cases/update-empleado/update-empleado-command.handler';
import { DeleteEmpleadoCommandHandler } from '../application/use-cases/delete-empleado/delete-empleado-command.handler';

export function registerEmpleadosModule(container: AwilixContainer) {
  container.register({
    // repositories
    empleadoRepository: asClass(PrismaEmpleadoRepository).singleton(),

    // use-cases
    getEmpleadosQueryHandler: asClass(GetEmpleadosQueryHandler).scoped(),
    getEmpleadoQueryHandler: asClass(GetEmpleadoQueryHandler).scoped(),
    createEmpleadoCommandHandler: asClass(CreateEmpleadoCommandHandler).scoped(),
    updateEmpleadoCommandHandler: asClass(UpdateEmpleadoCommandHandler).scoped(),
    deleteEmpleadoCommandHandler: asClass(DeleteEmpleadoCommandHandler).scoped(),
  });
}