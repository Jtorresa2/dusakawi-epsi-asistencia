import { asClass, type AwilixContainer } from 'awilix';
import { PrismaNovedadRepository } from './persistence/repositories/prisma/prisma-novedad-repository';
import { GetNovedadesQueryHandler } from '../application/use-cases/get-novedades/get-novedades-query.handler';
import { GetNovedadesPorEmpleadoQueryHandler } from '../application/use-cases/get-novedades-por-empleado/get-novedades-por-empleado-query.handler';
import { CreateNovedadCommandHandler } from '../application/use-cases/create-novedad/create-novedad-command.handler';
import { UpdateNovedadCommandHandler } from '../application/use-cases/update-novedad/update-novedad-command.handler';
import { DeleteNovedadCommandHandler } from '../application/use-cases/delete-novedad/delete-novedad-command.handler';

export function registerNovedadesModule(container: AwilixContainer) {
  container.register({
    // repositories
    novedadRepository: asClass(PrismaNovedadRepository).singleton(),

    // use-cases
    getNovedadesQueryHandler: asClass(GetNovedadesQueryHandler).scoped(),
    getNovedadesPorEmpleadoQueryHandler: asClass(GetNovedadesPorEmpleadoQueryHandler).scoped(),
    createNovedadCommandHandler: asClass(CreateNovedadCommandHandler).scoped(),
    updateNovedadCommandHandler: asClass(UpdateNovedadCommandHandler).scoped(),
    deleteNovedadCommandHandler: asClass(DeleteNovedadCommandHandler).scoped(),
  });
}