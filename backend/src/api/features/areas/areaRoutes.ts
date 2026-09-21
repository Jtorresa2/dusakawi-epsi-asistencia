import { Router } from 'express';
import auth from '../../shared/middlewares/authMiddleware';
import rol from '../../shared/middlewares/rol';
import * as areaController from './areaController';

const router: Router = Router();

// Lectura: cualquier usuario autenticado

/**
 * @swagger
 * /api/areas:
 *   get:
 *     summary: Listar todas las áreas
 *     tags: [Areas]
 *     responses:
 *       200:
 *         description: Lista de áreas
 */
router.get('/', auth, areaController.obtenerTodos);

/**
 * @swagger
 * /api/areas/{id}:
 *   get:
 *     summary: Obtener un área por ID
 *     tags: [Areas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Datos del área
 *       404:
 *         description: Área no encontrada
 */
router.get('/:id', auth, areaController.obtenerPorId);

/**
 * @swagger
 * /api/areas/{id}/empleados:
 *   get:
 *     summary: Obtener empleados que pertenecen a un área
 *     tags: [Areas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de empleados del área
 */
router.get('/:id/empleados', auth, areaController.obtenerEmpleadosPorArea);

// Escritura: solo admin y talento_humano

/**
 * @swagger
 * /api/areas:
 *   post:
 *     summary: Crear un área
 *     tags: [Areas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre]
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "Recursos Humanos"
 *     responses:
 *       201:
 *         description: Área creada
 *       403:
 *         description: Sin permisos
 */
router.post('/', auth, rol('admin', 'talento_humano'), areaController.crear);

/**
 * @swagger
 * /api/areas/{id}:
 *   put:
 *     summary: Actualizar un área
 *     tags: [Areas]
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
 *     responses:
 *       200:
 *         description: Área actualizada
 */
router.put('/:id', auth, rol('admin', 'talento_humano'), areaController.actualizar);

/**
 * @swagger
 * /api/areas/{id}:
 *   delete:
 *     summary: Eliminar un área
 *     tags: [Areas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Área eliminada
 *       403:
 *         description: Sin permisos
 */
router.delete('/:id', auth, rol('admin', 'talento_humano'), areaController.eliminar);

export default router;