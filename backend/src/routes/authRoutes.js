const router = require('express').Router();
const authController = require('../controllers/authController');
const auth = require('../middlewares/authMiddleware');
const { loginLimiter, passwordResetLimiter } = require('../middlewares/rateLimiter');

router.post('/login', loginLimiter, authController.login);
router.post('/cambiar-password', auth, authController.cambiarPassword);
router.get('/perfil', auth, authController.perfil);
router.post('/olvide-contrasena', passwordResetLimiter, authController.solicitarResetPassword);
router.post('/restablecer-contrasena', passwordResetLimiter, authController.restablecerPassword);

module.exports = router;
