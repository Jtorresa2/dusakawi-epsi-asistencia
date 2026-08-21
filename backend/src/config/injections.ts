import {
  createContainer,
  InjectionMode,
  asValue,
  type AwilixContainer,
} from 'awilix';
import { prisma } from './database/prisma/prisma.js';
import { registerUserModule } from '../modules/users/infrastructure/user.registry.js';

export function buildContainer(): AwilixContainer {
  const container = createContainer({
    injectionMode: InjectionMode.PROXY,
    strict: true,
  });

  container.register({
    prisma: asValue(prisma),
  });

  registerUserModule(container);

  return container;
}
