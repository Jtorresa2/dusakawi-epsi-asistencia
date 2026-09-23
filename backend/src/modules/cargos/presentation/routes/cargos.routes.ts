import { Router } from 'express';
import cargosController from '../controllers/cargos.controller';

const cargosRouter = Router();

cargosRouter.get('/', cargosController.getAll);
cargosRouter.get('/:id', cargosController.getById);
cargosRouter.post('/', cargosController.create);
cargosRouter.put('/:id', cargosController.update);
cargosRouter.delete('/:id', cargosController.delete);

export default cargosRouter;