import { Router } from 'express';
import areaController from '../controllers/areas.controller';

const areaRouter = Router();

areaRouter.get('/:id', areaController.getArea);

export default areaRouter;
