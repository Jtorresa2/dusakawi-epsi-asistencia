import { Router } from 'express';
import { createRequire } from 'node:module';
import incidenciasController from '../controllers/incidencias.controller';

const require = createRequire(import.meta.url);
const auth = require('../../../../middlewares/authMiddleware.js');
const rol = require('../../../../middlewares/rol.js');
const upload = require('../../../../middlewares/upload.js');
const uploadFirma = require('../../../../middlewares/uploadFirma.js');

const incidenciasRouter = Router();

incidenciasRouter.post('/', auth, upload.single('evidencia'), incidenciasController.crear);
incidenciasRouter.get('/stats', auth, rol('admin', 'talento_humano'), incidenciasController.obtenerStats);
incidenciasRouter.get('/activity', auth, rol('admin', 'talento_humano'), incidenciasController.obtenerActividad);
incidenciasRouter.get('/', auth, incidenciasController.obtenerTodas);
incidenciasRouter.get('/:id', auth, incidenciasController.obtenerPorId);
incidenciasRouter.put('/:id/aprobar', auth, rol('admin', 'talento_humano'), incidenciasController.aprobar);
incidenciasRouter.put('/:id/aprobar-con-firma', auth, rol('admin', 'talento_humano'), uploadFirma.single('archivo_firmado'), incidenciasController.aprobarConFirma);
incidenciasRouter.put('/:id/rechazar', auth, rol('admin', 'talento_humano'), incidenciasController.rechazar);
incidenciasRouter.put('/:id/solicitar-correccion', auth, rol('admin', 'talento_humano'), incidenciasController.solicitarCorreccion);
incidenciasRouter.delete('/:id', auth, incidenciasController.eliminar);

export default incidenciasRouter;