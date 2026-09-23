import { Router } from 'express';
import areaController from '../controllers/areas.controller';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
// Endpoint legacy portado (CommonJS) para GET /api/areas/:id/empleados
const legacyAreaController = require('../../../../controllers/areaController.js');

const areaRouter = Router();

areaRouter.get('/:id/empleados', legacyAreaController.obtenerEmpleadosPorArea);
areaRouter.get('/:id', areaController.getArea);
areaRouter.get('/', areaController.getAreas);
areaRouter.post('/', areaController.createArea);
areaRouter.delete('/:id', areaController.deleteArea);
areaRouter.put('/:id', areaController.updateArea);

export default areaRouter;
