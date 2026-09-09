import {
  createContainer,
  InjectionMode,
  asValue,
  type AwilixContainer,
} from 'awilix';
import { prisma } from './database/prisma/prisma.js';
import { registerUserModule } from '@modules/users/infrastructure/user.registry.js';
import { registerAreaModule } from '@modules/areas/infrastructure/area.registry.js';
import { registerAuthModule } from '@modules/auth/infrastructure/auth.registry.js';
import { registerPositionModule } from '@modules/positions/infrastructure/position.registry.js';

export function buildContainer(): AwilixContainer {
  const container = createContainer({
    injectionMode: InjectionMode.CLASSIC,
    strict: true,
  });

  container.register({
    prisma: asValue(prisma),
  });

  registerAuthModule(container);
  registerUserModule(container);
  registerAreaModule(container);
  registerPositionModule(container);

  return container;
}
