import { Router } from 'express';
import auth from '../middlewares/authMiddleware';
import rol from '../middlewares/rol';
import {
  getUsuarios, generarMasivos, getRoles,
  getPermisosRol, updateRol, getPendientesEmail, enviarEmailAcceso
} from '../controllers/usuariosController';

const router: Router = Router();

router.get('/', auth, rol('admin'), getUsuarios);
router.get('/pendientes-email', auth, rol('admin'), getPendientesEmail);
router.post('/enviar-email-acceso', auth, rol('admin'), enviarEmailAcceso);
router.post('/generar-masivos', auth, rol('admin'), generarMasivos);
router.get('/roles', auth, getRoles);
router.get('/roles/:id/permisos', auth, rol('admin'), getPermisosRol);
router.put('/roles/:id', auth, rol('admin'), updateRol);

export default router;