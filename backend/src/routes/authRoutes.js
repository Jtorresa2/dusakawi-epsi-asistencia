const router = require('express').Router();
const authController = require('../controllers/authController');
const auth = require('../middlewares/authMiddleware');

router.post('/login', authController.login);
router.get('/perfil', auth, authController.perfil);

module.exports = router;