const router = require('express').Router();
const auth = require('../middlewares/authMiddleware');
const horarioController = require('../controllers/horarioController');

// Rutas fijas PRIMERO (antes de /:id)
router.get('/',                auth, horarioController.obtenerTodos);
router.get('/mi-horario',       auth, horarioController.miHorario);
router.post('/asignar',         auth, horarioController.asignar);
router.post('/asignar-masivo',  auth, horarioController.asignarMasivo);
router.post('/desasignar',      auth, horarioController.desasignar);
router.get('/historial-global', auth, horarioController.historialGlobal);
router.get('/usuarios/:usuarioId/historial', auth, horarioController.historial);

// Rutas con :id
router.get('/:id/asignados',    auth, horarioController.asignados);
router.post('/:id/por-defecto', auth, horarioController.porDefecto);
router.post('/',                auth, horarioController.crear);
router.get('/:id',              auth, horarioController.obtenerPorId);
router.put('/:id',              auth, horarioController.actualizar);
router.delete('/:id',           auth, horarioController.eliminar);

module.exports = router;