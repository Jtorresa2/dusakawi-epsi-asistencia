const router = require('express').Router();
const auth = require('../middlewares/authMiddleware');
const rol = require('../middlewares/rol');
const {
  getUsuarios, crearUsuario, actualizarUsuario,
  eliminarUsuario, getRoles
} = require('../controllers/usuariosController');

router.get('/',       auth, rol('Administrador'), getUsuarios);
router.post('/',      auth, rol('Administrador'), crearUsuario);
router.put('/:id',    auth, rol('Administrador'), actualizarUsuario);
router.delete('/:id', auth, rol('Administrador'), eliminarUsuario);
router.get('/roles',  auth, getRoles);

module.exports = router;