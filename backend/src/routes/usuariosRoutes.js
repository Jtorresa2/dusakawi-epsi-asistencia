const router = require('express').Router();
const auth = require('../middlewares/authMiddleware');
const rol = require('../middlewares/rol');
const {
  getUsuarios, crearUsuario, actualizarUsuario,
  eliminarUsuario, generarMasivos, getRoles,
  getPermisosRol, updateRol,
  getPendientesEmail, enviarEmailAcceso
} = require('../controllers/usuariosController');

router.get('/',             auth, rol('admin'), getUsuarios);
router.post('/',            auth, rol('admin'), crearUsuario);
router.put('/:id',          auth, rol('admin'), actualizarUsuario);
router.delete('/:id',       auth, rol('admin'), eliminarUsuario);
router.post('/generar-masivos', auth, rol('admin'), generarMasivos);
router.get('/roles',        auth, getRoles);
router.get('/roles/:id/permisos', auth, rol('admin'), getPermisosRol);
router.put('/roles/:id',    auth, rol('admin'), updateRol);
router.get('/pendientes-email', auth, rol('admin'), getPendientesEmail);
router.post('/enviar-email-acceso', auth, rol('admin'), enviarEmailAcceso);

module.exports = router;
