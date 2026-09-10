import { Router } from 'express';
import areaController from '../controllers/areas.controller';

const areaRouter = Router();

areaRouter.get('/:id', areaController.getAreas);

export default areaRouter;
