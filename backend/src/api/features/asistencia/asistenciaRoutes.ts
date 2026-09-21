import { Router } from 'express';
import auth from '../../shared/middlewares/authMiddleware';
import { getRegistros, getMiAsistencia } from './asistenciaController';

const router: Router = Router();

/**
 * @swagger
 * /api/asistencia:
 *   get:
 *     summary: Listar todos los registros de asistencia (admin/TH ven todo, empleados ven los suyos)
 *     tags: [Asistencia]
 *     parameters:
 *       - in: query
 *         name: fecha
 *         schema:
 *           type: string
 *           format: date
 *         description: Filtrar por fecha específica (YYYY-MM-DD)
 *       - in: query
 *         name: empleado_id
 *         schema:
 *           type: integer
 *         description: Filtrar por empleado
 *     responses:
 *       200:
 *         description: Lista de registros de asistencia
 */
router.get('/', auth, getRegistros);

/**
 * @swagger
 * /api/asistencia/mi-asistencia:
 *   get:
 *     summary: Obtener registros de asistencia del usuario autenticado
 *     tags: [Asistencia]
 *     parameters:
 *       - in: query
 *         name: mes
 *         schema:
 *           type: integer
 *         description: Número de mes (1-12)
 *       - in: query
 *         name: anio
 *         schema:
 *           type: integer
 *         description: Año
 *     responses:
 *       200:
 *         description: Asistencia del usuario autenticado
 */
router.get('/mi-asistencia', auth, getMiAsistencia);

export default router;