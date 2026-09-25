import { Router } from 'express';
import { createRequire } from 'node:module';
import asistenciaController from '../controllers/asistencia.controller';

const require = createRequire(import.meta.url);
const auth = require('../../../../middlewares/authMiddleware.js');

const asistenciaRouter = Router();

asistenciaRouter.get('/',               auth, asistenciaController.getRegistros);
asistenciaRouter.get('/mi-asistencia',  auth, asistenciaController.getMiAsistencia);
asistenciaRouter.post('/marcar',        auth, asistenciaController.marcar);
asistenciaRouter.post('/manual',        auth, asistenciaController.registrarManual);
asistenciaRouter.post('/',              auth, asistenciaController.marcar);
asistenciaRouter.put('/:id',            auth, asistenciaController.actualizarRegistro);
asistenciaRouter.put('/:id/justificar', auth, asistenciaController.justificarAusencia);
asistenciaRouter.delete('/:id',         auth, asistenciaController.eliminarRegistro);

export default asistenciaRouter;