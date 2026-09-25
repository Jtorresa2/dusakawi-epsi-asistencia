import { Router } from 'express';
import { createRequire } from 'node:module';
import configController from '../controllers/config.controller';

const require = createRequire(import.meta.url);
const auth = require('../../../../middlewares/authMiddleware.js');
const rol = require('../../../../middlewares/rol.js');

const configRouter = Router();

configRouter.get('/', auth, rol('admin'), configController.obtenerConfig);
configRouter.put('/', auth, rol('admin'), configController.actualizarConfig);
configRouter.post('/respaldar', auth, rol('admin'), configController.respaldarBD);

export default configRouter;