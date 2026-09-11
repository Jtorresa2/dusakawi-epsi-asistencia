import { Router } from 'express';
import areaController from '../controllers/areas.controller';

const areaRouter = Router();

areaRouter.get('/:id', areaController.getArea);
areaRouter.get('/', areaController.getAreas);
areaRouter.post('/', areaController.createArea);
areaRouter.delete('/:id', areaController.deleteArea);

export default areaRouter;
