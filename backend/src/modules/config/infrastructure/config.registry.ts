import { asClass, type AwilixContainer } from 'awilix';
import { PrismaConfigRepository } from './persistence/repositories/prisma/prisma-config-repository';
import { GetConfigQueryHandler } from '../application/use-cases/get-config/get-config-query.handler';
import { UpdateConfigCommandHandler } from '../application/use-cases/update-config/update-config-command.handler';
import { BackupDbCommandHandler } from '../application/use-cases/backup-db/backup-db-command.handler';

export function registerConfigModule(container: AwilixContainer) {
  container.register({
    // repositories
    configRepository: asClass(PrismaConfigRepository).singleton(),

    // use-cases
    getConfigQueryHandler: asClass(GetConfigQueryHandler).scoped(),
    updateConfigCommandHandler: asClass(UpdateConfigCommandHandler).scoped(),
    backupDbCommandHandler: asClass(BackupDbCommandHandler).scoped(),
  });
}