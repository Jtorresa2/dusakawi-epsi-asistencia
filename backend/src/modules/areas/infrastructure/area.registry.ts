import { type AwilixContainer, asClass } from 'awilix';
import { PrismaFloorRepository } from './persistence/repositories/prisma/prisma-floor-repository';
import { PrismaAreaRepository } from './persistence/repositories/prisma/prisma-area-repository';
import { GetAreaQueryHandler } from '../application/use-cases/get-area/get-area-query.handler';
import { GetAreasQueryHandler } from '../application/use-cases/get-areas/get-areas-query.handler';
import { CreateAreaCommandHandler } from '../application/use-cases/create-area/create-area-command.handler';
import { DeleteAreaCommandHandler } from '../application/use-cases/delete-area/delete-area-command.handler';
import { UpdateAreaCommandHandler } from '../application/use-cases/update-area/update-area-command.handler';
import { GetFloorQueryHandler } from '../application/use-cases/get-floor/get-floor-query.handler';
import { GetFloorsQueryHandler } from '../application/use-cases/get-floors/get-floors-query.handler';
import { CreateFloorCommandHandler } from '../application/use-cases/create-floor/create-floor-command.handler';
import { DeleteFloorCommandHandler } from '../application/use-cases/delete-floor/delete-floor-command.handler';
import { UpdateFloorCommandHandler } from '../application/use-cases/update-floor/update-floor-command.handler';

export function registerAreasModule(container: AwilixContainer) {
  container.register({
    // repositories
    areaRepository: asClass(PrismaAreaRepository).singleton(),
    floorRepository: asClass(PrismaFloorRepository).singleton(),

    // use-cases
    getAreaQueryHandler: asClass(GetAreaQueryHandler).scoped(),
    getAreasQueryHandler: asClass(GetAreasQueryHandler).scoped(),
    createAreaCommandHandler: asClass(CreateAreaCommandHandler).scoped(),
    deleteAreaCommandHandler: asClass(DeleteAreaCommandHandler).scoped(),
    updateAreaCommandHandler: asClass(UpdateAreaCommandHandler).scoped(),
    getFloorQueryHandler: asClass(GetFloorQueryHandler).scoped(),
    getFloorsQueryHandler: asClass(GetFloorsQueryHandler).scoped(),
    createFloorCommandHandler: asClass(CreateFloorCommandHandler).scoped(),
    deleteFloorCommandHandler: asClass(DeleteFloorCommandHandler).scoped(),
    updateFloorCommandHandler: asClass(UpdateFloorCommandHandler).scoped(),
  });
}
