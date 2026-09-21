import { Router } from 'express';
import auth from '../middlewares/authMiddleware';
import { getRegistros, getMiAsistencia } from '../controllers/asistenciaController';

const router: Router = Router();

router.get('/', auth, getRegistros);
router.get('/mi-asistencia', auth, getMiAsistencia);

export default router;