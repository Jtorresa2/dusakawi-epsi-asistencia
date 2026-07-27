const router = require('express').Router();
const auth = require('../middlewares/authMiddleware');
const { getIndicadores, getResumenPorArea } = require('../controllers/dashboardController');

router.get('/indicadores', auth, getIndicadores);
router.get('/resumen-areas', auth, getResumenPorArea);

module.exports = router;