const router = require('express').Router();
const auth = require('../middlewares/authMiddleware');
const { getReporteDiario, getReporteMensual } = require('../controllers/reportesController');

router.get('/diario',  auth, getReporteDiario);
router.get('/mensual', auth, getReporteMensual);

module.exports = router;