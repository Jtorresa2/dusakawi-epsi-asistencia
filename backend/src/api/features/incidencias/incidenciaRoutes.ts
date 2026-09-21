import { Router } from 'express';
import auth from '../../shared/middlewares/authMiddleware';
import rol from '../../shared/middlewares/rol';
import upload from '../../shared/middlewares/upload';
import uploadFirma from '../../shared/middlewares/uploadFirma';
import { validarArchivo, TIPOS_INCIDENCIA, TIPOS_FIRMA } from '../../shared/middlewares/validarArchivo';
import * as incidenciaController from './incidenciaController';

const router: Router = Router();

/**
 * @swagger
 * /api/incidencias:
 *   post:
 *     summary: Crear una solicitud de incidencia (con evidencia adjunta opcional)
 *     tags: [Incidencias]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [tipo, descripcion, fecha]
 *             properties:
 *               tipo:
 *                 type: string
 *                 example: "permiso"
 *               descripcion:
 *                 type: string
 *                 example: "Cita médica"
 *               fecha:
 *                 type: string
 *                 format: date
 *                 example: "2026-09-25"
 *               evidencia:
 *                 type: string
 *                 format: binary
 *                 description: Archivo de evidencia (PDF, JPG, PNG)
 *     responses:
 *       201:
 *         description: Incidencia creada exitosamente
 */
router.post('/', auth, upload.single('evidencia'), validarArchivo(TIPOS_INCIDENCIA), incidenciaController.crear);

/**
 * @swagger
 * /api/incidencias/stats:
 *   get:
 *     summary: Obtener estadísticas generales de incidencias
 *     tags: [Incidencias]
 *     responses:
 *       200:
 *         description: Conteos por estado, tipo, etc.
 *       403:
 *         description: Sin permisos (requiere admin o talento_humano)
 */
router.get('/stats', auth, rol('admin', 'talento_humano'), incidenciaController.obtenerStats);

/**
 * @swagger
 * /api/incidencias/activity:
 *   get:
 *     summary: Obtener actividad reciente de incidencias
 *     tags: [Incidencias]
 *     responses:
 *       200:
 *         description: Registro de actividad reciente
 *       403:
 *         description: Sin permisos
 */
router.get('/activity', auth, rol('admin', 'talento_humano'), incidenciaController.obtenerActividad);

/**
 * @swagger
 * /api/incidencias:
 *   get:
 *     summary: Listar incidencias (propias si es empleado, todas si es admin/TH)
 *     tags: [Incidencias]
 *     parameters:
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [pendiente, aprobada, rechazada, correccion]
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de incidencias
 */
router.get('/', auth, incidenciaController.obtenerTodas);

/**
 * @swagger
 * /api/incidencias/{id}:
 *   get:
 *     summary: Obtener una incidencia por ID
 *     tags: [Incidencias]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Datos de la incidencia
 *       404:
 *         description: Incidencia no encontrada
 */
router.get('/:id', auth, incidenciaController.obtenerPorId);

/**
 * @swagger
 * /api/incidencias/{id}/aprobar:
 *   put:
 *     summary: Aprobar una incidencia
 *     tags: [Incidencias]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               observaciones: { type: string }
 *     responses:
 *       200:
 *         description: Incidencia aprobada
 *       403:
 *         description: Sin permisos
 */
router.put('/:id/aprobar', auth, rol('admin', 'talento_humano'), incidenciaController.aprobar);

/**
 * @swagger
 * /api/incidencias/{id}/aprobar-con-firma:
 *   put:
 *     summary: Aprobar incidencia adjuntando documento firmado
 *     tags: [Incidencias]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [archivo_firmado]
 *             properties:
 *               archivo_firmado:
 *                 type: string
 *                 format: binary
 *                 description: Documento firmado (PDF)
 *     responses:
 *       200:
 *         description: Incidencia aprobada con firma
 *       403:
 *         description: Sin permisos
 */
router.put('/:id/aprobar-con-firma', auth, rol('admin', 'talento_humano'), uploadFirma.single('archivo_firmado'), validarArchivo(TIPOS_FIRMA), incidenciaController.aprobarConFirma);

/**
 * @swagger
 * /api/incidencias/{id}/rechazar:
 *   put:
 *     summary: Rechazar una incidencia
 *     tags: [Incidencias]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               motivo_rechazo: { type: string }
 *     responses:
 *       200:
 *         description: Incidencia rechazada
 *       403:
 *         description: Sin permisos
 */
router.put('/:id/rechazar', auth, rol('admin', 'talento_humano'), incidenciaController.rechazar);

/**
 * @swagger
 * /api/incidencias/{id}/solicitar-correccion:
 *   put:
 *     summary: Solicitar corrección de una incidencia al empleado
 *     tags: [Incidencias]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               observaciones: { type: string }
 *     responses:
 *       200:
 *         description: Corrección solicitada
 *       403:
 *         description: Sin permisos
 */
router.put('/:id/solicitar-correccion', auth, rol('admin', 'talento_humano'), incidenciaController.solicitarCorreccion);

/**
 * @swagger
 * /api/incidencias/{id}:
 *   delete:
 *     summary: Eliminar una incidencia
 *     tags: [Incidencias]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Incidencia eliminada
 *       403:
 *         description: Sin permisos
 */
router.delete('/:id', auth, rol('admin', 'talento_humano'), incidenciaController.eliminar);

export default router;