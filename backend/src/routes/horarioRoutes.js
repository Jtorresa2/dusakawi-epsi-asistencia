const router = require('express').Router();
const auth = require('../middlewares/authMiddleware');
const horarioController = require('../controllers/horarioController');

router.get('/',        auth, horarioController.obtenerTodos);
router.get('/:id',     auth, horarioController.obtenerPorId);
router.put('/:id',     auth, horarioController.actualizar);

module.exports = router;
