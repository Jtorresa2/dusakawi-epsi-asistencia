const router = require('express').Router();
const auth = require('../middlewares/authMiddleware');
const { getRegistros, getMiAsistencia } = require('../controllers/asistenciaController');

router.get('/',           auth, getRegistros);
router.get('/mi-asistencia', auth, getMiAsistencia);

module.exports = router;

