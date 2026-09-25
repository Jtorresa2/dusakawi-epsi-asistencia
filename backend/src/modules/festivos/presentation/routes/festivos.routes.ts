import { Router } from 'express';
import { createRequire } from 'node:module';
import festivosController from '../controllers/festivos.controller';

const require = createRequire(import.meta.url);
const auth = require('../../../../middlewares/authMiddleware.js');
const rol = require('../../../../middlewares/rol.js');

const festivosRouter = Router();

festivosRouter.use(auth);

festivosRouter.get('/', festivosController.obtenerTodos);
festivosRouter.get('/verificar', festivosController.verificar);
festivosRouter.post('/', rol('admin', 'talento_humano'), festivosController.crear);
festivosRouter.put('/:id', rol('admin', 'talento_humano'), festivosController.actualizar);
festivosRouter.delete('/:id', rol('admin', 'talento_humano'), festivosController.eliminar);
festivosRouter.post('/generar', rol('admin', 'talento_humano'), festivosController.generar);

export default festivosRouter;