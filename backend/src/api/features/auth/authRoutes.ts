import { Router } from 'express';
import * as authController from '../controllers/authController';
import auth from '../middlewares/authMiddleware';
import { loginLimiter, passwordResetLimiter } from '../middlewares/rateLimiter';

const router: Router = Router();

router.post('/login', loginLimiter, authController.login);
router.post('/cambiar-password', auth, authController.cambiarPassword);
router.get('/perfil', auth, authController.perfil);
router.get('/permisos', auth, authController.misPermisos);
router.post('/olvide-contrasena', passwordResetLimiter, authController.solicitarResetPassword);
router.post('/restablecer-contrasena', passwordResetLimiter, authController.restablecerPassword);
router.get('/validar-token-reset', authController.validarTokenReset);
router.post('/logout', authController.logout);

export default router;