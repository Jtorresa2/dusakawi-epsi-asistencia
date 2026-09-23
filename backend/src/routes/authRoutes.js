const router = require('express').Router();
const authController = require('../controllers/authController');
const auth = require('../middlewares/authMiddleware');

router.post('/login', authController.login);
router.post('/cambiar-password', auth, authController.cambiarPassword);
router.get('/perfil', auth, authController.perfil);
router.post('/olvide-contrasena', authController.solicitarResetPassword);
router.get('/validar-token-reset', authController.validarTokenReset);
router.post('/restablecer-contrasena', authController.restablecerPassword);
router.get('/permisos', auth, authController.misPermisos);

module.exports = router;
