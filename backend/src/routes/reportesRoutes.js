const router = require('express').Router();
const auth = require('../middlewares/authMiddleware');
const {
  getReporteDiario,
  getReporteMensual,
  getIndicadores,
  getTendencia,
  getReporteAsistencia,
  getReporteIncidencias,
  getReporteTardanzas,
  getReporteAusencias,
  getReporteEmpleados,
  getReporteMarcaciones,
  getHistorial,
  guardarHistorial,
} = require('../controllers/reportesController');

router.get('/diario',  auth, getReporteDiario);
router.get('/mensual', auth, getReporteMensual);

router.get('/indicadores', auth, getIndicadores);
router.get('/tendencia',   auth, getTendencia);

router.get('/asistencia',  auth, getReporteAsistencia);
router.get('/incidencias', auth, getReporteIncidencias);
router.get('/tardanzas',   auth, getReporteTardanzas);
router.get('/ausencias',   auth, getReporteAusencias);
router.get('/empleados',   auth, getReporteEmpleados);
router.get('/marcaciones', auth, getReporteMarcaciones);

router.get('/historial',      auth, getHistorial);
router.post('/historial',     auth, guardarHistorial);

module.exports = router;
