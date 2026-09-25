import { Router } from 'express';
import { createRequire } from 'node:module';
import novedadesController from '../controllers/novedades.controller';

const require = createRequire(import.meta.url);
const auth = require('../../../../middlewares/authMiddleware.js');
const rol = require('../../../../middlewares/rol.js');

const novedadesRouter = Router();

novedadesRouter.use(auth);

novedadesRouter.get('/', novedadesController.obtenerTodos);
novedadesRouter.post('/', rol('admin', 'talento_humano'), novedadesController.crear);
novedadesRouter.put('/:id', rol('admin', 'talento_humano'), novedadesController.actualizar);
novedadesRouter.delete('/:id', rol('admin', 'talento_humano'), novedadesController.eliminar);

// Lectura para empleados (sus propias novedades)
novedadesRouter.get('/mios', novedadesController.mios);

export default novedadesRouter;