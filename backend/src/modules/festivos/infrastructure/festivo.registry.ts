import { asClass, type AwilixContainer } from 'awilix';
import { PrismaFestivoRepository } from './persistence/repositories/prisma/prisma-festivo-repository';
import { GetFestivosQueryHandler } from '../application/use-cases/get-festivos/get-festivos-query.handler';
import { GetFestivoQueryHandler } from '../application/use-cases/get-festivo/get-festivo-query.handler';
import { CreateFestivoCommandHandler } from '../application/use-cases/create-festivo/create-festivo-command.handler';
import { UpdateFestivoCommandHandler } from '../application/use-cases/update-festivo/update-festivo-command.handler';
import { DeleteFestivoCommandHandler } from '../application/use-cases/delete-festivo/delete-festivo-command.handler';
import { VerifyFestivoQueryHandler } from '../application/use-cases/verify-festivo/verify-festivo-query.handler';
import { GenerateFestivosCommandHandler } from '../application/use-cases/generate-festivos/generate-festivos-command.handler';

export function registerFestivosModule(container: AwilixContainer) {
  container.register({
    // repositories
    festivoRepository: asClass(PrismaFestivoRepository).singleton(),

    // use-cases
    getFestivosQueryHandler: asClass(GetFestivosQueryHandler).scoped(),
    getFestivoQueryHandler: asClass(GetFestivoQueryHandler).scoped(),
    createFestivoCommandHandler: asClass(CreateFestivoCommandHandler).scoped(),
    updateFestivoCommandHandler: asClass(UpdateFestivoCommandHandler).scoped(),
    deleteFestivoCommandHandler: asClass(DeleteFestivoCommandHandler).scoped(),
    verifyFestivoQueryHandler: asClass(VerifyFestivoQueryHandler).scoped(),
    generateFestivosCommandHandler: asClass(GenerateFestivosCommandHandler).scoped(),
  });
}