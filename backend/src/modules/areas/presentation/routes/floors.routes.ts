import { Router } from 'express';
import floorController from '../controllers/floors.controller';

const floorRouter = Router();

floorRouter.get('/:id', floorController.getFloor);
floorRouter.get('/', floorController.getFloors);
floorRouter.post('/', floorController.createFloor);
floorRouter.delete('/:id', floorController.deleteFloor);
floorRouter.put('/:id', floorController.updateFloor);

export default floorRouter;
