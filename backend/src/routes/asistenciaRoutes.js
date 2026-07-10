const router = require('express').Router();
const auth = require('../middlewares/authMiddleware');
const { getRegistros, registrarManual, getMiAsistencia, justificarAusencia } = require('../controllers/asistenciaController');

router.get('/',           auth, getRegistros);
router.get('/mi-asistencia', auth, getMiAsistencia);
router.post('/manual',    auth, registrarManual);
router.put('/:id/justificar', auth, justificarAusencia);

module.exports = router;

