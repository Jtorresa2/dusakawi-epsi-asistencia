import {
  createContainer,
  InjectionMode,
  asValue,
  type AwilixContainer,
} from 'awilix';
import { prisma } from './database/prisma/prisma.js';
import { registerUsersModule } from '@modules/users/infrastructure/user.registry.js';
import { registerAreasModule } from '@modules/areas/infrastructure/area.registry.js';
import { registerAuthModule } from '@modules/auth/infrastructure/auth.registry.js';
import { registerPositionsModule } from '@modules/positions/infrastructure/position.registry.js';
import { registerDocumentTypesModule } from '@modules/document-types/infrastructure/document-types.registry.js';
import { registerCargosModule } from '@modules/cargos/infrastructure/cargo.registry.js';

export function buildContainer(): AwilixContainer {
  const container = createContainer({
    injectionMode: InjectionMode.CLASSIC,
    strict: true,
  });

  container.register({
    prisma: asValue(prisma),
  });

  registerAuthModule(container);
  registerUsersModule(container);
  registerAreasModule(container);
  registerPositionsModule(container);
  registerDocumentTypesModule(container);
  registerCargosModule(container);

  return container;
}
