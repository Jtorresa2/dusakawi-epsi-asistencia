import { Router } from 'express';
import auth from '../../shared/middlewares/authMiddleware';
import rol from '../../shared/middlewares/rol';
import * as horarioController from './horarioController';

const router: Router = Router();

/**
 * @swagger
 * /api/horarios:
 *   get:
 *     summary: Listar todos los horarios disponibles
 *     tags: [Horarios]
 *     responses:
 *       200:
 *         description: Lista de horarios
 */
router.get('/', auth, horarioController.obtenerTodos);

/**
 * @swagger
 * /api/horarios/asignar:
 *   post:
 *     summary: Asignar un horario a un usuario
 *     tags: [Horarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [usuario_id, horario_id, fecha_inicio]
 *             properties:
 *               usuario_id: { type: integer, example: 5 }
 *               horario_id: { type: integer, example: 2 }
 *               fecha_inicio: { type: string, format: date, example: "2026-01-01" }
 *     responses:
 *       200:
 *         description: Horario asignado
 *       403:
 *         description: Sin permisos (requiere admin o talento_humano)
 */
router.post('/asignar', auth, rol('admin', 'talento_humano'), horarioController.asignar);

/**
 * @swagger
 * /api/horarios/asignar-masivo:
 *   post:
 *     summary: Asignar un horario a múltiples usuarios a la vez
 *     tags: [Horarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [usuario_ids, horario_id, fecha_inicio]
 *             properties:
 *               usuario_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 2, 3]
 *               horario_id: { type: integer, example: 2 }
 *               fecha_inicio: { type: string, format: date, example: "2026-01-01" }
 *     responses:
 *       200:
 *         description: Horario asignado masivamente
 *       403:
 *         description: Sin permisos
 */
router.post('/asignar-masivo', auth, rol('admin', 'talento_humano'), horarioController.asignarMasivo);

/**
 * @swagger
 * /api/horarios/desasignar:
 *   post:
 *     summary: Desasignar el horario activo de un usuario
 *     tags: [Horarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [usuario_id]
 *             properties:
 *               usuario_id: { type: integer, example: 5 }
 *     responses:
 *       200:
 *         description: Horario desasignado
 *       403:
 *         description: Sin permisos
 */
router.post('/desasignar', auth, rol('admin', 'talento_humano'), horarioController.desasignar);

/**
 * @swagger
 * /api/horarios/{id}/por-defecto:
 *   post:
 *     summary: Marcar un horario como horario por defecto del sistema
 *     tags: [Horarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Horario marcado como por defecto
 *       403:
 *         description: Sin permisos (requiere admin)
 */
router.post('/:id/por-defecto', auth, rol('admin'), horarioController.porDefecto);

/**
 * @swagger
 * /api/horarios/usuarios/{usuarioId}/historial:
 *   get:
 *     summary: Ver historial de horarios de un usuario específico
 *     tags: [Horarios]
 *     parameters:
 *       - in: path
 *         name: usuarioId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Historial de asignaciones del usuario
 *       403:
 *         description: Sin permisos
 */
router.get('/usuarios/:usuarioId/historial', auth, rol('admin', 'talento_humano'), horarioController.historial);

/**
 * @swagger
 * /api/horarios/mi-horario:
 *   get:
 *     summary: Obtener el horario activo del usuario autenticado
 *     tags: [Horarios]
 *     responses:
 *       200:
 *         description: Horario actual del usuario
 *       404:
 *         description: Sin horario asignado
 */
router.get('/mi-horario', auth, horarioController.miHorario);

/**
 * @swagger
 * /api/horarios/historial-global:
 *   get:
 *     summary: Ver historial global de asignaciones de todos los usuarios
 *     tags: [Horarios]
 *     responses:
 *       200:
 *         description: Historial global de asignaciones
 *       403:
 *         description: Sin permisos
 */
router.get('/historial-global', auth, rol('admin', 'talento_humano'), horarioController.historialGlobal);

/**
 * @swagger
 * /api/horarios/{id}/asignados:
 *   get:
 *     summary: Ver usuarios asignados a un horario específico
 *     tags: [Horarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de usuarios asignados a este horario
 */
router.get('/:id/asignados', auth, rol('admin', 'talento_humano'), horarioController.asignados);

/**
 * @swagger
 * /api/horarios/{id}:
 *   get:
 *     summary: Obtener un horario por ID
 *     tags: [Horarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Datos del horario
 *       404:
 *         description: Horario no encontrado
 */
router.get('/:id', auth, horarioController.obtenerPorId);

/**
 * @swagger
 * /api/horarios:
 *   post:
 *     summary: Crear un nuevo horario
 *     tags: [Horarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, hora_entrada, hora_salida]
 *             properties:
 *               nombre: { type: string, example: "Turno Mañana" }
 *               hora_entrada: { type: string, example: "08:00" }
 *               hora_salida: { type: string, example: "17:00" }
 *               tolerancia_minutos: { type: integer, example: 10 }
 *     responses:
 *       201:
 *         description: Horario creado
 *       403:
 *         description: Sin permisos (requiere admin)
 */
router.post('/', auth, rol('admin'), horarioController.crear);

/**
 * @swagger
 * /api/horarios/{id}:
 *   put:
 *     summary: Actualizar un horario
 *     tags: [Horarios]
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
 *               hora_entrada: { type: string }
 *               hora_salida: { type: string }
 *               tolerancia_minutos: { type: integer }
 *     responses:
 *       200:
 *         description: Horario actualizado
 */
router.put('/:id', auth, rol('admin'), horarioController.actualizar);

/**
 * @swagger
 * /api/horarios/{id}:
 *   delete:
 *     summary: Eliminar un horario
 *     tags: [Horarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Horario eliminado
 *       403:
 *         description: Sin permisos (requiere admin)
 */
router.delete('/:id', auth, rol('admin'), horarioController.eliminar);

export default router;