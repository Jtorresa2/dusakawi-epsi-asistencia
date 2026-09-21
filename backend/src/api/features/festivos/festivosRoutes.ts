import { Router } from 'express';
import * as festivosController from './festivosController';
import auth from '../../shared/middlewares/authMiddleware';
import rol from '../../shared/middlewares/rol';

const router: Router = Router();

router.use(auth);

/**
 * @swagger
 * /api/festivos:
 *   get:
 *     summary: Listar todos los días festivos registrados
 *     tags: [Festivos]
 *     parameters:
 *       - in: query
 *         name: anio
 *         schema:
 *           type: integer
 *         description: Filtrar por año
 *     responses:
 *       200:
 *         description: Lista de festivos
 */
router.get('/', festivosController.obtenerTodos);

/**
 * @swagger
 * /api/festivos/verificar:
 *   get:
 *     summary: Verificar si una fecha es día festivo
 *     tags: [Festivos]
 *     parameters:
 *       - in: query
 *         name: fecha
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha a verificar (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Resultado de la verificación
 */
router.get('/verificar', festivosController.verificar);

/**
 * @swagger
 * /api/festivos:
 *   post:
 *     summary: Registrar un día festivo manualmente
 *     tags: [Festivos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fecha, nombre]
 *             properties:
 *               fecha: { type: string, format: date, example: "2026-12-25" }
 *               nombre: { type: string, example: "Navidad" }
 *     responses:
 *       201:
 *         description: Festivo registrado
 *       403:
 *         description: Sin permisos
 */
router.post('/', rol('admin', 'talento_humano'), festivosController.crear);

/**
 * @swagger
 * /api/festivos/{id}:
 *   put:
 *     summary: Actualizar un festivo
 *     tags: [Festivos]
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
 *               fecha: { type: string, format: date }
 *               nombre: { type: string }
 *     responses:
 *       200:
 *         description: Festivo actualizado
 */
router.put('/:id', rol('admin', 'talento_humano'), festivosController.actualizar);

/**
 * @swagger
 * /api/festivos/{id}:
 *   delete:
 *     summary: Eliminar un festivo
 *     tags: [Festivos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Festivo eliminado
 */
router.delete('/:id', rol('admin', 'talento_humano'), festivosController.eliminar);

/**
 * @swagger
 * /api/festivos/generar:
 *   post:
 *     summary: Generar automáticamente los festivos de Colombia para un año
 *     tags: [Festivos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [anio]
 *             properties:
 *               anio: { type: integer, example: 2027 }
 *     responses:
 *       200:
 *         description: Festivos generados
 *       403:
 *         description: Sin permisos
 */
router.post('/generar', rol('admin', 'talento_humano'), festivosController.generar);

export default router;