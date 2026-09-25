import { Router } from 'express';
import usuariosController from '../controllers/usuarios.controller';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const auth = require('../../../../middlewares/authMiddleware.js');
const rol = require('../../../../middlewares/rol.js');

const usuariosRouter = Router();

usuariosRouter.get('/', auth, rol('admin'), usuariosController.getUsuarios);
usuariosRouter.post('/', auth, rol('admin'), usuariosController.crearUsuario);
usuariosRouter.put('/:id', auth, rol('admin'), usuariosController.actualizarUsuario);
usuariosRouter.delete('/:id', auth, rol('admin'), usuariosController.eliminarUsuario);
usuariosRouter.post('/generar-masivos', auth, rol('admin'), usuariosController.generarMasivos);
usuariosRouter.get('/roles', auth, usuariosController.getRoles);
usuariosRouter.get('/roles/:id/permisos', auth, rol('admin'), usuariosController.getPermisosRol);
usuariosRouter.put('/roles/:id', auth, rol('admin'), usuariosController.updateRol);
usuariosRouter.get('/pendientes-email', auth, rol('admin'), usuariosController.getPendientesEmail);
usuariosRouter.post('/enviar-email-acceso', auth, rol('admin'), usuariosController.enviarEmailAcceso);

export default usuariosRouter;
