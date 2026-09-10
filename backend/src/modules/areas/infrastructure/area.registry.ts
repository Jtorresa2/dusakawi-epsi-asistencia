import { type AwilixContainer, asClass } from 'awilix';
import { PrismaFloorRepository } from './persistence/repositories/prisma/prisma-floor-repository';
import { PrismaAreaRepository } from './persistence/repositories/prisma/prisma-area-repository';
import { GetAreaQueryHandler } from '../application/use-cases/get-area/get-area-query.handler';

export function registerAreasModule(container: AwilixContainer) {
  container.register({
    // repositories
    areaRepository: asClass(PrismaAreaRepository).singleton(),
    floorRepository: asClass(PrismaFloorRepository).singleton(),

    // use-cases
    getAreaQueryHandler: asClass(GetAreaQueryHandler).scoped(),
  });
}
