import { Router } from 'express';
import { registrarMarcacion } from './marcacionController';

const router: Router = Router();

/**
 * @swagger
 * /api/marcacion:
 *   post:
 *     summary: Registrar marcación desde dispositivo biométrico
 *     description: Endpoint sin autenticación JWT — el dispositivo biométrico lo invoca directamente.
 *     tags: [Marcacion]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [documento, tipo]
 *             properties:
 *               documento:
 *                 type: string
 *                 description: Número de documento del empleado
 *                 example: "1234567890"
 *               tipo:
 *                 type: string
 *                 enum: [entrada, salida]
 *                 example: "entrada"
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *                 description: Fecha y hora de la marcación (ISO 8601)
 *     responses:
 *       200:
 *         description: Marcación registrada correctamente
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Empleado no encontrado
 */
// No requiere auth por ahora — el dispositivo biométrico no tiene token.
// Cuando se implemente auth por dispositivo, se agrega el middleware.
router.post('/', registrarMarcacion);

export default router;