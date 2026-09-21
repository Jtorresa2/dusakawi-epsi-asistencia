import { Router } from 'express';
import auth from '../../shared/middlewares/authMiddleware';
import { getIndicadores, getResumenPorArea } from './dashboardController';

const router: Router = Router();

/**
 * @swagger
 * /api/dashboard/indicadores:
 *   get:
 *     summary: Obtener indicadores generales del dashboard
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Indicadores (total empleados, asistencia hoy, incidencias pendientes, etc.)
 */
router.get('/indicadores', auth, getIndicadores);

/**
 * @swagger
 * /api/dashboard/resumen-areas:
 *   get:
 *     summary: Obtener resumen de asistencia agrupado por área
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Resumen por área
 */
router.get('/resumen-areas', auth, getResumenPorArea);

export default router;