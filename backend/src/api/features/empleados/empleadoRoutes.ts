import { Router } from 'express';
import auth from '../../shared/middlewares/authMiddleware';
import rol from '../../shared/middlewares/rol';
import * as empleadoController from './empleadoController';

const router: Router = Router();

// Backward-compat surface: /api/empleados delegates to personalService.
// GET: any authenticated user (personal list / own profile flows).
// PUT allows self-edit for any authenticated user; admin/TH may edit others;
// rol_id changes are admin-only (enforced in the controller).
// POST/DELETE: only admin and talento_humano (same as /api/usuarios).

/**
 * @swagger
 * /api/empleados:
 *   get:
 *     summary: Listar todos los empleados
 *     tags: [Empleados]
 *     responses:
 *       200:
 *         description: Lista de empleados
 *       401:
 *         description: No autenticado
 */
router.get('/', auth, empleadoController.obtenerTodos);

/**
 * @swagger
 * /api/empleados/{id}:
 *   get:
 *     summary: Obtener un empleado por ID
 *     tags: [Empleados]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Datos del empleado
 *       404:
 *         description: Empleado no encontrado
 */
router.get('/:id', auth, empleadoController.obtenerPorId);

/**
 * @swagger
 * /api/empleados:
 *   post:
 *     summary: Crear un nuevo empleado
 *     tags: [Empleados]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, email, area_id, cargo_id]
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "Juan Pérez"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "juan.perez@dusakawi.com"
 *               area_id:
 *                 type: integer
 *                 example: 2
 *               cargo_id:
 *                 type: integer
 *                 example: 3
 *               rol_id:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       201:
 *         description: Empleado creado exitosamente
 *       403:
 *         description: Sin permisos (requiere admin o talento_humano)
 */
router.post('/', auth, rol('admin', 'talento_humano'), empleadoController.crear);

/**
 * @swagger
 * /api/empleados/{id}:
 *   put:
 *     summary: Actualizar datos de un empleado
 *     tags: [Empleados]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre: { type: string }
 *               email: { type: string, format: email }
 *               area_id: { type: integer }
 *               cargo_id: { type: integer }
 *     responses:
 *       200:
 *         description: Empleado actualizado
 *       403:
 *         description: Sin permisos para este cambio
 */
router.put('/:id', auth, empleadoController.actualizar);

/**
 * @swagger
 * /api/empleados/{id}:
 *   delete:
 *     summary: Eliminar un empleado
 *     tags: [Empleados]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Empleado eliminado
 *       403:
 *         description: Sin permisos (requiere admin o talento_humano)
 *       404:
 *         description: Empleado no encontrado
 */
router.delete('/:id', auth, rol('admin', 'talento_humano'), empleadoController.eliminar);

export default router;