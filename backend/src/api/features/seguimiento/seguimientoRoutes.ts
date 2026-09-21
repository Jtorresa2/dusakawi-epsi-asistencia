import { Router } from 'express';
import auth from '../../shared/middlewares/authMiddleware';
import rol from '../../shared/middlewares/rol';
import { obtener } from './seguimientoController';

const router: Router = Router();

// Módulo de SOLO CONSULTA (REQ-13/14): restringido a admin y talento_humano.

/**
 * @swagger
 * /api/seguimiento:
 *   get:
 *     summary: Consultar log de acciones del sistema (auditoría)
 *     tags: [Seguimiento]
 *     parameters:
 *       - in: query
 *         name: fecha_inicio
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: fecha_fin
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: usuario_id
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Registro de acciones realizadas en el sistema
 *       403:
 *         description: Sin permisos (requiere admin o talento_humano)
 */
router.get('/', auth, rol('admin', 'talento_humano'), obtener);

export default router;