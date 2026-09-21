import { Router } from 'express';
import auth from '../middlewares/authMiddleware';
import rol from '../middlewares/rol';
import upload from '../middlewares/upload';
import uploadFirma from '../middlewares/uploadFirma';
import { validarArchivo, TIPOS_INCIDENCIA, TIPOS_FIRMA } from '../middlewares/validarArchivo';
import * as incidenciaController from '../controllers/incidenciaController';

const router: Router = Router();

router.post('/', auth, upload.single('evidencia'), validarArchivo(TIPOS_INCIDENCIA), incidenciaController.crear);
router.get('/stats', auth, rol('admin', 'talento_humano'), incidenciaController.obtenerStats);
router.get('/activity', auth, rol('admin', 'talento_humano'), incidenciaController.obtenerActividad);
router.get('/', auth, incidenciaController.obtenerTodas);
router.get('/:id', auth, incidenciaController.obtenerPorId);
router.put('/:id/aprobar', auth, rol('admin', 'talento_humano'), incidenciaController.aprobar);
router.put('/:id/aprobar-con-firma', auth, rol('admin', 'talento_humano'), uploadFirma.single('archivo_firmado'), validarArchivo(TIPOS_FIRMA), incidenciaController.aprobarConFirma);
router.put('/:id/rechazar', auth, rol('admin', 'talento_humano'), incidenciaController.rechazar);
router.put('/:id/solicitar-correccion', auth, rol('admin', 'talento_humano'), incidenciaController.solicitarCorreccion);
router.delete('/:id', auth, rol('admin', 'talento_humano'), incidenciaController.eliminar);

export default router;