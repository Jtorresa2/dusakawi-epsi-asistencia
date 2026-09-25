import { Router } from 'express';
import { createRequire } from 'module';
import dashboardController from '../controllers/dashboard.controller';

const require = createRequire(import.meta.url);
const auth = require('../../../../middlewares/authMiddleware.js');

const dashboardRouter = Router();

dashboardRouter.get('/indicadores', auth, dashboardController.getIndicadores);
dashboardRouter.get('/resumen-areas', auth, dashboardController.getResumenPorArea);

export default dashboardRouter;