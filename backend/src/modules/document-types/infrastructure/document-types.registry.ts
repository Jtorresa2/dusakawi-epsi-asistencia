import { type AwilixContainer, asClass } from 'awilix';
import { PrismaDocumentTypeRepository } from './persistence/repositories/prisma/prisma-document-type-repository';

export function registerDocumentTypesModule(container: AwilixContainer) {
  container.register({
    // repositories
    documentTypeRepository: asClass(PrismaDocumentTypeRepository).singleton(),
  });
}
