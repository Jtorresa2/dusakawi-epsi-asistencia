const router = require('express').Router();
const { registrarMarcacion } = require('../controllers/marcacionController');

// No requiere auth por ahora — el dispositivo biométrico no tiene token.
// Cuando se implemente auth por dispositivo, se agrega el middleware.
router.post('/', registrarMarcacion);

module.exports = router;
