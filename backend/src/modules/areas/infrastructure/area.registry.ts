import { type AwilixContainer, asClass } from 'awilix';
import { PrismaFloorRepository } from './persistence/repositories/prisma/prisma-floor-repository';
import { PrismaAreaRepository } from './persistence/repositories/prisma/prisma-area-repository';

export function registerAreaModule(container: AwilixContainer) {
  container.register({
    // repositories
    areaRepository: asClass(PrismaAreaRepository).singleton(),
    floorRepository: asClass(PrismaFloorRepository).singleton(),
  });
}
