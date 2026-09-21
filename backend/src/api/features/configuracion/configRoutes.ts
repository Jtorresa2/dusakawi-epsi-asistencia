import { Router } from 'express';
import auth from '../../shared/middlewares/authMiddleware';
import rol from '../../shared/middlewares/rol';
import * as configController from './configController';

const router: Router = Router();

/**
 * @swagger
 * /api/config:
 *   get:
 *     summary: Obtener configuración general del sistema
 *     tags: [Configuracion]
 *     responses:
 *       200:
 *         description: Parámetros de configuración del sistema
 *       403:
 *         description: Sin permisos (requiere admin)
 */
router.get('/', auth, rol('admin'), configController.obtenerConfig);

/**
 * @swagger
 * /api/config:
 *   put:
 *     summary: Actualizar configuración general del sistema
 *     tags: [Configuracion]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Campos de configuración a actualizar
 *     responses:
 *       200:
 *         description: Configuración actualizada
 *       403:
 *         description: Sin permisos (requiere admin)
 */
router.put('/', auth, rol('admin'), configController.actualizarConfig);

/**
 * @swagger
 * /api/config/respaldar:
 *   post:
 *     summary: Generar un respaldo (backup) de la base de datos
 *     tags: [Configuracion]
 *     responses:
 *       200:
 *         description: Respaldo generado exitosamente
 *       403:
 *         description: Sin permisos (requiere admin)
 */
router.post('/respaldar', auth, rol('admin'), configController.respaldarBD);

export default router;