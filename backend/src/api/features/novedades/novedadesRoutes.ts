import { Router } from 'express';
import * as novedadesController from './novedadesController';
import authMiddleware from '../../shared/middlewares/authMiddleware';
import rol from '../../shared/middlewares/rol';

const router: Router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * /api/novedades:
 *   get:
 *     summary: Listar todas las novedades (comunicados internos)
 *     tags: [Novedades]
 *     responses:
 *       200:
 *         description: Lista de novedades
 */
router.get('/', novedadesController.obtenerTodos);

/**
 * @swagger
 * /api/novedades:
 *   post:
 *     summary: Crear una novedad
 *     tags: [Novedades]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [titulo, contenido]
 *             properties:
 *               titulo: { type: string, example: "Actualización de políticas" }
 *               contenido: { type: string, example: "A partir del próximo lunes..." }
 *     responses:
 *       201:
 *         description: Novedad creada
 *       403:
 *         description: Sin permisos
 */
router.post('/', rol('admin', 'talento_humano'), novedadesController.crear);

/**
 * @swagger
 * /api/novedades/{id}:
 *   put:
 *     summary: Actualizar una novedad
 *     tags: [Novedades]
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
 *               titulo: { type: string }
 *               contenido: { type: string }
 *     responses:
 *       200:
 *         description: Novedad actualizada
 */
router.put('/:id', rol('admin', 'talento_humano'), novedadesController.actualizar);

/**
 * @swagger
 * /api/novedades/{id}:
 *   delete:
 *     summary: Eliminar una novedad
 *     tags: [Novedades]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Novedad eliminada
 */
router.delete('/:id', rol('admin', 'talento_humano'), novedadesController.eliminar);

/**
 * @swagger
 * /api/novedades/mios:
 *   get:
 *     summary: Obtener las novedades dirigidas al usuario autenticado
 *     tags: [Novedades]
 *     responses:
 *       200:
 *         description: Novedades del empleado autenticado
 */
// Lectura para empleados (sus propias novedades)
router.get('/mios', novedadesController.mios);

export default router;