import { Router } from 'express';
import empleadosController from '../controllers/empleados.controller';

const empleadosRouter = Router();

empleadosRouter.get('/', empleadosController.obtenerTodos);
empleadosRouter.get('/:id', empleadosController.obtenerPorId);
empleadosRouter.post('/', empleadosController.crear);
empleadosRouter.put('/:id', empleadosController.actualizar);
empleadosRouter.delete('/:id', empleadosController.eliminar);

export default empleadosRouter;