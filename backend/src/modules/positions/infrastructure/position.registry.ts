import { type AwilixContainer, asClass } from 'awilix';
import { PrismaPositionRepository } from './persistence/repositories/prisma/prisma-position-repository';

export function registerPositionModule(container: AwilixContainer) {
  container.register({
    // repositories
    positionRepository: asClass(PrismaPositionRepository).singleton(),
  });
}
