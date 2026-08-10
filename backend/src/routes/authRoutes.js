const router = require('express').Router();
const authController = require('../controllers/authController');
const auth = require('../middlewares/authMiddleware');

router.post('/login', authController.login);
router.post('/cambiar-password', auth, authController.cambiarPassword);
router.get('/perfil', auth, authController.perfil);
router.post('/olvide-contrasena', authController.solicitarResetPassword);
router.post('/restablecer-contrasena', authController.restablecerPassword);

module.exports = router;
