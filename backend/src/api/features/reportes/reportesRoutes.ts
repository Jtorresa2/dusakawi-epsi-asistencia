import { Router } from 'express';
import auth from '../../shared/middlewares/authMiddleware';
import rol from '../../shared/middlewares/rol';
import {
  getReporteDiario,
  getReporteMensual,
  getIndicadores,
  getTendencia,
  getReporteAsistencia,
  getReporteIncidencias,
  getReporteTardanzas,
  getReporteAusencias,
  getReportePorEmpleado,
  getReporteEmpleados,
  getReporteMarcaciones,
  getHistorial,
  guardarHistorial,
} from './reportesController';

const router: Router = Router();

/**
 * @swagger
 * /api/reportes/diario:
 *   get:
 *     summary: Reporte de asistencia del día actual
 *     tags: [Reportes]
 *     responses:
 *       200:
 *         description: Reporte diario de asistencia
 */
router.get('/diario', auth, getReporteDiario);

/**
 * @swagger
 * /api/reportes/mensual:
 *   get:
 *     summary: Reporte de asistencia mensual
 *     tags: [Reportes]
 *     parameters:
 *       - in: query
 *         name: mes
 *         schema: { type: integer }
 *         description: Mes (1-12)
 *       - in: query
 *         name: anio
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Reporte mensual de asistencia
 */
router.get('/mensual', auth, getReporteMensual);

/**
 * @swagger
 * /api/reportes/indicadores:
 *   get:
 *     summary: Indicadores generales de asistencia para reportes
 *     tags: [Reportes]
 *     responses:
 *       200:
 *         description: Indicadores (puntualidad, ausentismo, etc.)
 */
router.get('/indicadores', auth, getIndicadores);

/**
 * @swagger
 * /api/reportes/tendencia:
 *   get:
 *     summary: Tendencia de asistencia en el tiempo
 *     tags: [Reportes]
 *     responses:
 *       200:
 *         description: Datos de tendencia para gráficas
 */
router.get('/tendencia', auth, getTendencia);

/**
 * @swagger
 * /api/reportes/asistencia:
 *   get:
 *     summary: Reporte detallado de asistencia
 *     tags: [Reportes]
 *     parameters:
 *       - in: query
 *         name: fecha_inicio
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: fecha_fin
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: area_id
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Reporte de asistencia filtrado
 */
router.get('/asistencia', auth, getReporteAsistencia);

/**
 * @swagger
 * /api/reportes/incidencias:
 *   get:
 *     summary: Reporte de incidencias
 *     tags: [Reportes]
 *     responses:
 *       200:
 *         description: Reporte de incidencias por período
 */
router.get('/incidencias', auth, getReporteIncidencias);

/**
 * @swagger
 * /api/reportes/tardanzas:
 *   get:
 *     summary: Reporte de tardanzas
 *     tags: [Reportes]
 *     responses:
 *       200:
 *         description: Reporte de tardanzas por período y empleado
 */
router.get('/tardanzas', auth, getReporteTardanzas);

/**
 * @swagger
 * /api/reportes/ausencias:
 *   get:
 *     summary: Reporte de ausencias
 *     tags: [Reportes]
 *     responses:
 *       200:
 *         description: Reporte de ausencias por período y empleado
 */
router.get('/ausencias', auth, getReporteAusencias);

/**
 * @swagger
 * /api/reportes/por-empleado:
 *   get:
 *     summary: Reporte de asistencia de un empleado específico
 *     tags: [Reportes]
 *     parameters:
 *       - in: query
 *         name: empleado_id
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: mes
 *         schema: { type: integer }
 *       - in: query
 *         name: anio
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Reporte individual del empleado
 */
router.get('/por-empleado', auth, getReportePorEmpleado);

/**
 * @swagger
 * /api/reportes/empleados:
 *   get:
 *     summary: Reporte consolidado de todos los empleados
 *     tags: [Reportes]
 *     responses:
 *       200:
 *         description: Reporte consolidado
 */
router.get('/empleados', auth, getReporteEmpleados);

/**
 * @swagger
 * /api/reportes/marcaciones:
 *   get:
 *     summary: Reporte detallado de marcaciones (entradas/salidas)
 *     tags: [Reportes]
 *     parameters:
 *       - in: query
 *         name: fecha
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Reporte de marcaciones
 */
router.get('/marcaciones', auth, getReporteMarcaciones);

/**
 * @swagger
 * /api/reportes/historial:
 *   get:
 *     summary: Obtener historial de reportes guardados
 *     tags: [Reportes]
 *     responses:
 *       200:
 *         description: Lista de reportes guardados
 */
router.get('/historial', auth, getHistorial);

/**
 * @swagger
 * /api/reportes/historial:
 *   post:
 *     summary: Guardar un reporte en el historial
 *     tags: [Reportes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tipo, parametros]
 *             properties:
 *               tipo: { type: string, example: "mensual" }
 *               parametros: { type: object }
 *     responses:
 *       201:
 *         description: Reporte guardado en historial
 *       403:
 *         description: Sin permisos
 */
router.post('/historial', auth, rol('admin', 'talento_humano'), guardarHistorial);

export default router;