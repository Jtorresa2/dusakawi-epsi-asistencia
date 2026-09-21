import { Router } from 'express';
import auth from '../middlewares/authMiddleware';
import rol from '../middlewares/rol';
import {
  getReporteDiario,
  getReporteMensual,
  getIndicadores,
  getTendencia,
  getReporteAsistencia,
  getReporteIncidencias,
  getReporteTardanzas,
  getReporteAusencias,
  getReportePorEmpleado,
  getReporteEmpleados,
  getReporteMarcaciones,
  getHistorial,
  guardarHistorial,
} from '../controllers/reportesController';

const router: Router = Router();

router.get('/diario', auth, getReporteDiario);
router.get('/mensual', auth, getReporteMensual);

router.get('/indicadores', auth, getIndicadores);
router.get('/tendencia', auth, getTendencia);

router.get('/asistencia', auth, getReporteAsistencia);
router.get('/incidencias', auth, getReporteIncidencias);
router.get('/tardanzas', auth, getReporteTardanzas);
router.get('/ausencias', auth, getReporteAusencias);
router.get('/por-empleado', auth, getReportePorEmpleado);
router.get('/empleados', auth, getReporteEmpleados);
router.get('/marcaciones', auth, getReporteMarcaciones);

router.get('/historial', auth, getHistorial);
router.post('/historial', auth, rol('admin', 'talento_humano'), guardarHistorial);

export default router;