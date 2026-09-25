import { type AwilixContainer, asClass } from 'awilix';
import { PrismaDashboardIndicadoresRepository } from './persistence/repositories/prisma/prisma-dashboard-indicadores-repository';
import { PrismaDashboardResumenAreaRepository } from './persistence/repositories/prisma/prisma-dashboard-resumen-area-repository';
import { GetIndicadoresQueryHandler } from '../application/use-cases/get-indicadores/get-indicadores-query.handler';
import { GetResumenPorAreaQueryHandler } from '../application/use-cases/get-resumen-por-area/get-resumen-por-area-query.handler';

export function registerDashboardModule(container: AwilixContainer) {
  container.register({
    // repositories
    dashboardIndicadoresRepository: asClass(PrismaDashboardIndicadoresRepository).singleton(),
    dashboardResumenAreaRepository: asClass(PrismaDashboardResumenAreaRepository).singleton(),

    // use-cases
    getIndicadoresQueryHandler: asClass(GetIndicadoresQueryHandler).scoped(),
    getResumenPorAreaQueryHandler: asClass(GetResumenPorAreaQueryHandler).scoped(),
  });
}