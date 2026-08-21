import { type AwilixContainer, asClass } from 'awilix';
import { DocumentDetailsCreator } from '../domain/services/document-details-creator.js';
import { PrismaUserRepository } from './persistence/repositories/prisma/prisma-user-repository.js';
import { RegisterCommandHandler } from '../application/use-cases/register/register-command.handler.js';
import { PrismaDocumentTypeRepository } from './persistence/repositories/prisma/prisma-document-type-repository.js';
import { PrismaPositionRepository } from './persistence/repositories/prisma/prisma-position-repository.js';
import { PrismaRoleRepository } from './persistence/repositories/prisma/prisma-role-repository.js';
import { JwtHandler } from './security/jwt/jwt.handler.js';
import { BcryptjsPasswordHasher } from './security/bcryptjs-password-hasher.js';
import { LoginQueryHandler } from '../application/use-cases/login/login-query.handler.js';

export function registerUserModule(container: AwilixContainer) {
  container.register({
    // repositories
    documentTypeRepository: asClass(PrismaDocumentTypeRepository).singleton(),
    positionRepository: asClass(PrismaPositionRepository).singleton(),
    roleRepository: asClass(PrismaRoleRepository).singleton(),
    userRepository: asClass(PrismaUserRepository).singleton(),

    // services
    documentDetailsCreator: asClass(DocumentDetailsCreator).singleton(),
    tokenHandler: asClass(JwtHandler).singleton(),
    passwordHasher: asClass(BcryptjsPasswordHasher).singleton(),

    // use-cases
    registerCommandHandler: asClass(RegisterCommandHandler).scoped(),
    loginQueryHandler: asClass(LoginQueryHandler).scoped(),
  });
}
