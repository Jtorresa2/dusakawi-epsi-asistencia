import { Router } from 'express';
import auth from '../../shared/middlewares/authMiddleware';
import rol from '../../shared/middlewares/rol';
import * as cargoController from './cargoController';

const router: Router = Router();

/**
 * @swagger
 * /api/cargos:
 *   get:
 *     summary: Listar todos los cargos
 *     tags: [Cargos]
 *     responses:
 *       200:
 *         description: Lista de cargos
 */
router.get('/', auth, cargoController.obtenerTodos);

/**
 * @swagger
 * /api/cargos/{id}:
 *   get:
 *     summary: Obtener un cargo por ID
 *     tags: [Cargos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Datos del cargo
 *       404:
 *         description: Cargo no encontrado
 */
router.get('/:id', auth, cargoController.obtenerPorId);

/**
 * @swagger
 * /api/cargos:
 *   post:
 *     summary: Crear un cargo
 *     tags: [Cargos]
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
 *                 example: "Coordinador de RRHH"
 *     responses:
 *       201:
 *         description: Cargo creado
 *       403:
 *         description: Sin permisos (requiere admin)
 */
router.post('/', auth, rol('admin'), cargoController.crear);

/**
 * @swagger
 * /api/cargos/{id}:
 *   put:
 *     summary: Actualizar un cargo
 *     tags: [Cargos]
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
 *         description: Cargo actualizado
 */
router.put('/:id', auth, rol('admin'), cargoController.actualizar);

/**
 * @swagger
 * /api/cargos/{id}:
 *   delete:
 *     summary: Eliminar un cargo
 *     tags: [Cargos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Cargo eliminado
 *       403:
 *         description: Sin permisos (requiere admin)
 */
router.delete('/:id', auth, rol('admin'), cargoController.eliminar);

export default router;