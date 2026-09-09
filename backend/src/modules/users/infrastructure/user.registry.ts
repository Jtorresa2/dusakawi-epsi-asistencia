import { type AwilixContainer, asClass } from 'awilix';
import { DocumentDetailsCreator } from '../domain/services/document-details-creator';
import { PrismaUserRepository } from './persistence/repositories/prisma/prisma-user-repository';
import { PrismaRoleRepository } from './persistence/repositories/prisma/prisma-role-repository';
import { GetUserQueryHandler } from '../application/use-cases/get-user/get-user-query.handler';
import { DeleteUserCommandHandler } from '../application/use-cases/delete-user/delete-user-command.handler';
import { GetUsersQueryHandler } from '../application/use-cases/get-users/get-users-query.handler';
import { UpdateBasicDataCommandHandler } from '../application/use-cases/update-basic-data/update-basic-data-command.handler';
import { UpdateWorkDataCommandHandler } from '../application/use-cases/update-work-data/update-work-data-command.handler';

export function registerUsersModule(container: AwilixContainer) {
  container.register({
    // repositories
    roleRepository: asClass(PrismaRoleRepository).singleton(),
    userRepository: asClass(PrismaUserRepository).singleton(),

    // services
    documentDetailsCreator: asClass(DocumentDetailsCreator).singleton(),

    // use-cases
    getUserQueryHandler: asClass(GetUserQueryHandler).scoped(),
    getUsersQueryHandler: asClass(GetUsersQueryHandler).scoped(),
    deleteUserCommandHandler: asClass(DeleteUserCommandHandler).scoped(),
    updateBasicDataCommandHandler: asClass(
      UpdateBasicDataCommandHandler,
    ).scoped(),
    updateWorkDataCommandHandler: asClass(
      UpdateWorkDataCommandHandler,
    ).scoped(),
  });
}
