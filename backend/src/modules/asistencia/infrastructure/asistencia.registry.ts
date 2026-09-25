import { asClass, type AwilixContainer } from 'awilix';
import { PrismaAsistenciaRepository } from './persistence/repositories/prisma/prisma-asistencia-repository';
import { ObtenerRegistrosHandler } from '../application/use-cases/obtener-registros/obtener-registros.handler';
import { RegistrarManualHandler } from '../application/use-cases/registrar-manual/registrar-manual.handler';
import { MarcarHandler } from '../application/use-cases/marcar/marcar.handler';
import { ObtenerMiAsistenciaHandler } from '../application/use-cases/obtener-mi-asistencia/obtener-mi-asistencia.handler';
import { JustificarAusenciaHandler } from '../application/use-cases/justificar-ausencia/justificar-ausencia.handler';
import { EliminarRegistroHandler } from '../application/use-cases/eliminar-registro/eliminar-registro.handler';
import { ActualizarRegistroHandler } from '../application/use-cases/actualizar-registro/actualizar-registro.handler';

export function registerAsistenciaModule(container: AwilixContainer) {
  container.register({
    // repositories
    asistenciaRepository: asClass(PrismaAsistenciaRepository).singleton(),

    // use-cases
    obtenerRegistrosHandler: asClass(ObtenerRegistrosHandler).scoped(),
    registrarManualHandler: asClass(RegistrarManualHandler).scoped(),
    marcarHandler: asClass(MarcarHandler).scoped(),
    obtenerMiAsistenciaHandler: asClass(ObtenerMiAsistenciaHandler).scoped(),
    justificarAusenciaHandler: asClass(JustificarAusenciaHandler).scoped(),
    eliminarRegistroHandler: asClass(EliminarRegistroHandler).scoped(),
    actualizarRegistroHandler: asClass(ActualizarRegistroHandler).scoped(),
  });
}