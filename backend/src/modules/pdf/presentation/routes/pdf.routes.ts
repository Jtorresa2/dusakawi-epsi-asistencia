import { createRequire } from 'node:module';
import { Router } from 'express';
import pdfController from '../controllers/pdf.controller';

const require = createRequire(import.meta.url);
const auth = require('../../../../middlewares/authMiddleware.js');
const rol = require('../../../../middlewares/rol.js');

const pdfRouter = Router();

// Orden exacto del legado: paramétrica antes que /incidencias
pdfRouter.get('/incidencias/:id/plantilla', pdfController.getIncidenciaTemplate);
pdfRouter.get('/test', pdfController.getTest);
pdfRouter.get('/asistencia', pdfController.getAsistencia);
pdfRouter.get('/incidencias', pdfController.getIncidencias);
pdfRouter.get('/dashboard', pdfController.getDashboard);
pdfRouter.get('/tardanzas', pdfController.getTardanzas);
pdfRouter.get('/ausencias', pdfController.getAusencias);
pdfRouter.get('/empleados', pdfController.getEmpleados);
pdfRouter.get('/marcaciones', pdfController.getMarcaciones);
pdfRouter.get('/por-areas', pdfController.getPorAreas);
pdfRouter.get('/por-empleado', pdfController.getPorEmpleado);
pdfRouter.get('/seguimiento', auth, rol('admin', 'talento_humano'), pdfController.getSeguimiento);

export default pdfRouter;
