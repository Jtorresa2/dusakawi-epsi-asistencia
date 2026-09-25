import { asClass, type AwilixContainer } from 'awilix';
import { PrismaSeguimientoRepository } from './persistence/repositories/prisma/prisma-seguimiento-repository';
import { ObtenerSeguimientoQueryHandler } from '../application/use-cases/obtener-seguimiento/obtener-seguimiento-query.handler';

export function registerSeguimientoModule(container: AwilixContainer) {
  container.register({
    // repositories
    seguimientoRepository: asClass(PrismaSeguimientoRepository).singleton(),

    // use-cases
    obtenerSeguimientoQueryHandler: asClass(ObtenerSeguimientoQueryHandler).scoped(),
  });
}