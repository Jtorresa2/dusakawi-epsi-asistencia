import { Router } from 'express';
import auth from '../middlewares/authMiddleware';
import rol from '../middlewares/rol';
import { obtener } from '../controllers/seguimientoController';

const router: Router = Router();

// Módulo de SOLO CONSULTA (REQ-13/14): restringido a admin y talento_humano.
router.get('/', auth, rol('admin', 'talento_humano'), obtener);

export default router;