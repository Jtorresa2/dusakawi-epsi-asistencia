import { Router } from 'express';
import * as authController from './authController';
import auth from '../../shared/middlewares/authMiddleware';
import { loginLimiter, passwordResetLimiter } from '../../shared/middlewares/rateLimiter';

const router: Router = Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@dusakawi.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "Admin1234!"
 *     responses:
 *       200:
 *         description: Login exitoso — retorna datos del usuario y asigna cookie JWT
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 usuario:
 *                   type: object
 *                   properties:
 *                     id: { type: integer, example: 1 }
 *                     nombre: { type: string, example: "Administrador" }
 *                     email: { type: string, example: "admin@dusakawi.com" }
 *                     rol: { type: string, example: "admin" }
 *       401:
 *         description: Credenciales inválidas
 *       429:
 *         description: Demasiados intentos — rate limit activo
 */
router.post('/login', loginLimiter, authController.login);

/**
 * @swagger
 * /api/auth/cambiar-password:
 *   post:
 *     summary: Cambiar contraseña del usuario autenticado
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [passwordActual, passwordNuevo]
 *             properties:
 *               passwordActual:
 *                 type: string
 *                 format: password
 *               passwordNuevo:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Contraseña actualizada correctamente
 *       401:
 *         description: No autenticado o contraseña actual incorrecta
 */
router.post('/cambiar-password', auth, authController.cambiarPassword);

/**
 * @swagger
 * /api/auth/perfil:
 *   get:
 *     summary: Obtener perfil del usuario autenticado
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Datos del perfil del usuario
 *       401:
 *         description: No autenticado
 */
router.get('/perfil', auth, authController.perfil);

/**
 * @swagger
 * /api/auth/permisos:
 *   get:
 *     summary: Obtener permisos del usuario autenticado
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Lista de permisos del rol del usuario
 *       401:
 *         description: No autenticado
 */
router.get('/permisos', auth, authController.misPermisos);

/**
 * @swagger
 * /api/auth/olvide-contrasena:
 *   post:
 *     summary: Solicitar restablecimiento de contraseña por email
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: usuario@dusakawi.com
 *     responses:
 *       200:
 *         description: Email enviado si el usuario existe
 *       429:
 *         description: Rate limit activo
 */
router.post('/olvide-contrasena', passwordResetLimiter, authController.solicitarResetPassword);

/**
 * @swagger
 * /api/auth/restablecer-contrasena:
 *   post:
 *     summary: Restablecer contraseña con token de email
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, passwordNuevo]
 *             properties:
 *               token:
 *                 type: string
 *               passwordNuevo:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Contraseña restablecida correctamente
 *       400:
 *         description: Token inválido o expirado
 */
router.post('/restablecer-contrasena', passwordResetLimiter, authController.restablecerPassword);

/**
 * @swagger
 * /api/auth/validar-token-reset:
 *   get:
 *     summary: Validar si un token de restablecimiento es vigente
 *     tags: [Auth]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Token válido
 *       400:
 *         description: Token inválido o expirado
 */
router.get('/validar-token-reset', authController.validarTokenReset);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Cerrar sesión (limpia la cookie JWT)
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Sesión cerrada correctamente
 */
router.post('/logout', authController.logout);

export default router;