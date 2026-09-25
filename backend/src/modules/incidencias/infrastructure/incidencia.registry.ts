import { asClass, type AwilixContainer } from 'awilix';
import { PrismaIncidenciaRepository } from './persistence/repositories/prisma/prisma-incidencia-repository';
import { GetIncidenciasQueryHandler } from '../application/use-cases/get-incidencias/get-incidencias-query.handler';
import { GetIncidenciaPorIdQueryHandler } from '../application/use-cases/get-incidencia-por-id/get-incidencia-por-id-query.handler';
import { CrearIncidenciaCommandHandler } from '../application/use-cases/crear-incidencia/crear-incidencia-command.handler';
import { AprobarIncidenciaCommandHandler } from '../application/use-cases/aprobar-incidencia/aprobar-incidencia-command.handler';
import { AprobarIncidenciaConFirmaCommandHandler } from '../application/use-cases/aprobar-incidencia-con-firma/aprobar-incidencia-con-firma-command.handler';
import { RechazarIncidenciaCommandHandler } from '../application/use-cases/rechazar-incidencia/rechazar-incidencia-command.handler';
import { SolicitarCorreccionIncidenciaCommandHandler } from '../application/use-cases/solicitar-correccion-incidencia/solicitar-correccion-incidencia-command.handler';
import { EliminarIncidenciaCommandHandler } from '../application/use-cases/eliminar-incidencia/eliminar-incidencia-command.handler';
import { GetStatsIncidenciasQueryHandler } from '../application/use-cases/get-stats-incidencias/get-stats-incidencias-query.handler';
import { GetActividadIncidenciasQueryHandler } from '../application/use-cases/get-actividad-incidencias/get-actividad-incidencias-query.handler';

export function registerIncidenciasModule(container: AwilixContainer) {
  container.register({
    // repositories
    incidenciaRepository: asClass(PrismaIncidenciaRepository).singleton(),

    // use-cases
    getIncidenciasQueryHandler: asClass(GetIncidenciasQueryHandler).scoped(),
    getIncidenciaPorIdQueryHandler: asClass(GetIncidenciaPorIdQueryHandler).scoped(),
    crearIncidenciaCommandHandler: asClass(CrearIncidenciaCommandHandler).scoped(),
    aprobarIncidenciaCommandHandler: asClass(AprobarIncidenciaCommandHandler).scoped(),
    aprobarIncidenciaConFirmaCommandHandler: asClass(AprobarIncidenciaConFirmaCommandHandler).scoped(),
    rechazarIncidenciaCommandHandler: asClass(RechazarIncidenciaCommandHandler).scoped(),
    solicitarCorreccionIncidenciaCommandHandler: asClass(SolicitarCorreccionIncidenciaCommandHandler).scoped(),
    eliminarIncidenciaCommandHandler: asClass(EliminarIncidenciaCommandHandler).scoped(),
    getStatsIncidenciasQueryHandler: asClass(GetStatsIncidenciasQueryHandler).scoped(),
    getActividadIncidenciasQueryHandler: asClass(GetActividadIncidenciasQueryHandler).scoped(),
  });
}