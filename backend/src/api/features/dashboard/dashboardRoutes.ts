import { Router } from 'express';
import auth from '../middlewares/authMiddleware';
import { getIndicadores, getResumenPorArea } from '../controllers/dashboardController';

const router: Router = Router();

router.get('/indicadores', auth, getIndicadores);
router.get('/resumen-areas', auth, getResumenPorArea);

export default router;