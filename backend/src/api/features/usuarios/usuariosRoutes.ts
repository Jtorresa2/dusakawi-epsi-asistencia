import { Router } from 'express';
import auth from '../../shared/middlewares/authMiddleware';
import rol from '../../shared/middlewares/rol';
import {
  getUsuarios, getRoles,
  getPermisosRol, updateRol, getPendientesEmail, enviarEmailAcceso
} from './usuariosController';

const router: Router = Router();

/**
 * @swagger
 * /api/usuarios:
 *   get:
 *     summary: Listar todos los usuarios del sistema
 *     tags: [Usuarios]
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *       403:
 *         description: Sin permisos (requiere admin)
 */
router.get('/', auth, rol('admin'), getUsuarios);

/**
 * @swagger
 * /api/usuarios/pendientes-email:
 *   get:
 *     summary: Listar usuarios que no han recibido email de acceso
 *     tags: [Usuarios]
 *     responses:
 *       200:
 *         description: Lista de usuarios pendientes de notificación
 *       403:
 *         description: Sin permisos (requiere admin)
 */
router.get('/pendientes-email', auth, rol('admin'), getPendientesEmail);

/**
 * @swagger
 * /api/usuarios/enviar-email-acceso:
 *   post:
 *     summary: Enviar email de acceso/bienvenida a un usuario
 *     tags: [Usuarios]
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
 *         description: Email enviado
 *       403:
 *         description: Sin permisos (requiere admin)
 */
router.post('/enviar-email-acceso', auth, rol('admin'), enviarEmailAcceso);

/**
 * @swagger
 * /api/usuarios/roles:
 *   get:
 *     summary: Listar todos los roles disponibles
 *     tags: [Usuarios]
 *     responses:
 *       200:
 *         description: Lista de roles
 */
router.get('/roles', auth, getRoles);

/**
 * @swagger
 * /api/usuarios/roles/{id}/permisos:
 *   get:
 *     summary: Obtener los permisos asignados a un rol
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de permisos del rol
 *       403:
 *         description: Sin permisos (requiere admin)
 */
router.get('/roles/:id/permisos', auth, rol('admin'), getPermisosRol);

/**
 * @swagger
 * /api/usuarios/roles/{id}:
 *   put:
 *     summary: Actualizar permisos de un rol
 *     tags: [Usuarios]
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
 *               permisos:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["ver_reportes", "gestionar_empleados"]
 *     responses:
 *       200:
 *         description: Rol actualizado
 *       403:
 *         description: Sin permisos (requiere admin)
 */
router.put('/roles/:id', auth, rol('admin'), updateRol);

export default router;