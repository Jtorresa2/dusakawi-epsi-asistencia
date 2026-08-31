import { type AwilixContainer, asClass } from 'awilix';
import { PrismaFloorRepository } from './persistence/repositories/prisma/prisma-floor-repository.js';
import { PrismaAreaRepository } from './persistence/repositories/prisma/prisma-area-repository.js';

export function registerAreaModule(container: AwilixContainer) {
  container.register({
    // repositories
    areaRepository: asClass(PrismaAreaRepository).singleton(),
    floorRepository: asClass(PrismaFloorRepository).singleton(),
  });
}
