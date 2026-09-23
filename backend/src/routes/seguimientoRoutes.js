const router = require('express').Router();
const auth = require('../middlewares/authMiddleware');
const seguimientoController = require('../controllers/seguimientoController');

router.get('/', auth, seguimientoController.obtener);

module.exports = router;