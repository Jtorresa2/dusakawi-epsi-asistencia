import { createRequire } from 'node:module';
import { Router } from 'express';
import reportsController from '../controllers/reports.controller';

const require = createRequire(import.meta.url);
const auth = require('../../../../middlewares/authMiddleware.js');

const reportsRouter = Router();

reportsRouter.get('/diario', auth, reportsController.getDaily);
reportsRouter.get('/mensual', auth, reportsController.getMonthly);
reportsRouter.get('/indicadores', auth, reportsController.getIndicators);
reportsRouter.get('/tendencia', auth, reportsController.getTrend);
reportsRouter.get('/asistencia', auth, reportsController.getAttendance);
reportsRouter.get('/incidencias', auth, reportsController.getIncidents);
reportsRouter.get('/tardanzas', auth, reportsController.getLateArrivals);
reportsRouter.get('/ausencias', auth, reportsController.getAbsences);
reportsRouter.get('/por-empleado', auth, reportsController.getEmployee);
reportsRouter.get('/por-areas', auth, reportsController.getAreas);
reportsRouter.get('/empleados', auth, reportsController.getEmployees);
reportsRouter.get('/marcaciones', auth, reportsController.getMarkings);
reportsRouter.get('/historial', auth, reportsController.getHistory);
reportsRouter.post('/historial', auth, reportsController.saveHistory);

export default reportsRouter;
