import {
  createContainer,
  InjectionMode,
  asValue,
  type AwilixContainer,
} from 'awilix';
import { prisma } from './database/prisma/prisma.js';
import { registerUsersModule } from '@modules/users/infrastructure/user.registry.js';
import { registerUsuariosModule } from '@modules/usuarios/infrastructure/usuarios.registry.js';
import { registerAreasModule } from '@modules/areas/infrastructure/area.registry.js';
import { registerAuthModule } from '@modules/auth/infrastructure/auth.registry.js';
import { registerPositionsModule } from '@modules/positions/infrastructure/position.registry.js';
import { registerDocumentTypesModule } from '@modules/document-types/infrastructure/document-types.registry.js';
import { registerCargosModule } from '@modules/cargos/infrastructure/cargo.registry.js';
import { registerDashboardModule } from '@modules/dashboard/infrastructure/dashboard.registry.js';
import { registerConfigModule } from '@modules/config/infrastructure/config.registry.js';
import { registerEmpleadosModule } from '@modules/empleados/infrastructure/empleado.registry.js';
import { registerFestivosModule } from '@modules/festivos/infrastructure/festivo.registry.js';
import { registerNovedadesModule } from '@modules/novedades/infrastructure/novedad.registry.js';
import { registerIncidenciasModule } from '@modules/incidencias/infrastructure/incidencia.registry.js';
import { registerSeguimientoModule } from '@modules/seguimiento/infrastructure/seguimiento.registry.js';
import { registerAsistenciaModule } from '@modules/asistencia/infrastructure/asistencia.registry.js';
import { registerSchedulesModule } from '@modules/horarios/infrastructure/schedule.registry.js';
import { registerReportsModule } from '@modules/reportes/infrastructure/report.registry.js';

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
  registerUsuariosModule(container);
  registerAreasModule(container);
  registerPositionsModule(container);
  registerDocumentTypesModule(container);
  registerCargosModule(container);
  registerDashboardModule(container);
  registerConfigModule(container);
  registerEmpleadosModule(container);
  registerFestivosModule(container);
  registerNovedadesModule(container);
  registerIncidenciasModule(container);
  registerSeguimientoModule(container);
  registerAsistenciaModule(container);
  registerSchedulesModule(container);
  registerReportsModule(container);

  return container;
}
