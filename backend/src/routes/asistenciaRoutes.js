const router = require('express').Router();
const auth = require('../middlewares/authMiddleware');
const { getRegistros, registrarManual, actualizarRegistro, getMiAsistencia, justificarAusencia, eliminarRegistro } = require('../controllers/asistenciaController');

router.get('/',           auth, getRegistros);
router.get('/mi-asistencia', auth, getMiAsistencia);
router.post('/manual',    auth, registrarManual);
router.put('/:id',        auth, actualizarRegistro);
router.put('/:id/justificar', auth, justificarAusencia);
router.delete('/:id',     auth, eliminarRegistro);

module.exports = router;

