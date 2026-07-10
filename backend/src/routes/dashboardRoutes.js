const router = require('express').Router();
const auth = require('../middlewares/authMiddleware');
const { getIndicadores } = require('../controllers/dashboardController');

router.get('/indicadores', auth, getIndicadores);

module.exports = router;