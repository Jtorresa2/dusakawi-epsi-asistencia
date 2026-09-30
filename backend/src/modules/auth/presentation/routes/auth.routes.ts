import { Router } from 'express';
import { createRequire } from 'node:module';
import authController from '../controllers/auth.controller';

const require = createRequire(import.meta.url);
const auth = require('../../../../middlewares/authMiddleware.js');

const authRouter = Router();

authRouter.post('/login', authController.login);
authRouter.post('/register', authController.register);
authRouter.post('/cambiar-password', auth, authController.cambiarPassword);
authRouter.get('/perfil', auth, authController.perfil);
authRouter.post('/olvide-contrasena', authController.solicitarResetPassword);
authRouter.get('/validar-token-reset', authController.validarTokenReset);
authRouter.post('/restablecer-contrasena', authController.restablecerPassword);
authRouter.get('/permisos', auth, authController.misPermisos);

export default authRouter;
