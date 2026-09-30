import { asClass, type AwilixContainer } from 'awilix';
import { GetIncidenciaTemplateHandler } from '../application/use-cases/get-incidencia-template/get-incidencia-template.handler';
import { GetTestPdfHandler } from '../application/use-cases/get-test-pdf/get-test-pdf.handler';
import { GetAsistenciaPdfHandler } from '../application/use-cases/get-asistencia-pdf/get-asistencia-pdf.handler';
import { GetIncidenciasPdfHandler } from '../application/use-cases/get-incidencias-pdf/get-incidencias-pdf.handler';
import { GetDashboardPdfHandler } from '../application/use-cases/get-dashboard-pdf/get-dashboard-pdf.handler';
import { GetTardanzasPdfHandler } from '../application/use-cases/get-tardanzas-pdf/get-tardanzas-pdf.handler';
import { GetAusenciasPdfHandler } from '../application/use-cases/get-ausencias-pdf/get-ausencias-pdf.handler';
import { GetEmpleadosPdfHandler } from '../application/use-cases/get-empleados-pdf/get-empleados-pdf.handler';
import { GetMarcacionesPdfHandler } from '../application/use-cases/get-marcaciones-pdf/get-marcaciones-pdf.handler';
import { GetPorAreasPdfHandler } from '../application/use-cases/get-por-areas-pdf/get-por-areas-pdf.handler';
import { GetPorEmpleadoPdfHandler } from '../application/use-cases/get-por-empleado-pdf/get-por-empleado-pdf.handler';
import { GetSeguimientoPdfHandler } from '../application/use-cases/get-seguimiento-pdf/get-seguimiento-pdf.handler';
import { PrismaPdfRepository } from './persistence/repositories/prisma/prisma-pdf-repository';
import { PdfTemplateService } from './services/pdf-template.service';

export function registerPdfModule(container: AwilixContainer) {
  container.register({
    // repositories
    pdfRepository: asClass(PrismaPdfRepository).singleton(),

    // services
    pdfTemplateService: asClass(PdfTemplateService).singleton(),

    // use-cases
    getIncidenciaTemplateHandler: asClass(GetIncidenciaTemplateHandler).scoped(),
    getTestPdfHandler: asClass(GetTestPdfHandler).scoped(),
    getAsistenciaPdfHandler: asClass(GetAsistenciaPdfHandler).scoped(),
    getIncidenciasPdfHandler: asClass(GetIncidenciasPdfHandler).scoped(),
    getDashboardPdfHandler: asClass(GetDashboardPdfHandler).scoped(),
    getTardanzasPdfHandler: asClass(GetTardanzasPdfHandler).scoped(),
    getAusenciasPdfHandler: asClass(GetAusenciasPdfHandler).scoped(),
    getEmpleadosPdfHandler: asClass(GetEmpleadosPdfHandler).scoped(),
    getMarcacionesPdfHandler: asClass(GetMarcacionesPdfHandler).scoped(),
    getPorAreasPdfHandler: asClass(GetPorAreasPdfHandler).scoped(),
    getPorEmpleadoPdfHandler: asClass(GetPorEmpleadoPdfHandler).scoped(),
    getSeguimientoPdfHandler: asClass(GetSeguimientoPdfHandler).scoped(),
  });
}