import { Router } from 'express';
import { createRequire } from 'node:module';
import seguimientoController from '../controllers/seguimiento.controller';

const require = createRequire(import.meta.url);
const auth = require('../../../../middlewares/authMiddleware.js');

const seguimientoRouter = Router();

seguimientoRouter.get('/', auth, seguimientoController.obtener);

export default seguimientoRouter;