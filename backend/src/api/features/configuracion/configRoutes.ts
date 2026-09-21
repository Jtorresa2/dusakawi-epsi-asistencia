import { Router } from 'express';
import auth from '../middlewares/authMiddleware';
import rol from '../middlewares/rol';
import * as configController from '../controllers/configController';

const router: Router = Router();

router.get('/', auth, rol('admin'), configController.obtenerConfig);
router.put('/', auth, rol('admin'), configController.actualizarConfig);
router.post('/respaldar', auth, rol('admin'), configController.respaldarBD);

export default router;