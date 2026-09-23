import { type AwilixContainer, asClass } from 'awilix';
import { PrismaCargoRepository } from './persistence/repositories/prisma/prisma-cargo-repository';
import { GetCargosQueryHandler } from '../application/use-cases/get-cargos/get-cargos-query.handler';
import { GetCargoQueryHandler } from '../application/use-cases/get-cargo/get-cargo-query.handler';
import { CreateCargoCommandHandler } from '../application/use-cases/create-cargo/create-cargo-command.handler';
import { UpdateCargoCommandHandler } from '../application/use-cases/update-cargo/update-cargo-command.handler';
import { DeleteCargoCommandHandler } from '../application/use-cases/delete-cargo/delete-cargo-command.handler';

export function registerCargosModule(container: AwilixContainer) {
  container.register({
    // repositories
    cargoRepository: asClass(PrismaCargoRepository).singleton(),

    // use-cases
    getCargosQueryHandler: asClass(GetCargosQueryHandler).scoped(),
    getCargoQueryHandler: asClass(GetCargoQueryHandler).scoped(),
    createCargoCommandHandler: asClass(CreateCargoCommandHandler).scoped(),
    updateCargoCommandHandler: asClass(UpdateCargoCommandHandler).scoped(),
    deleteCargoCommandHandler: asClass(DeleteCargoCommandHandler).scoped(),
  });
}