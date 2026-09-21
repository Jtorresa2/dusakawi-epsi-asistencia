import { Router } from 'express';
import * as novedadesController from '../controllers/novedadesController';
import authMiddleware from '../middlewares/authMiddleware';
import rol from '../middlewares/rol';

const router: Router = Router();

router.use(authMiddleware);

router.get('/', novedadesController.obtenerTodos);
router.post('/', rol('admin', 'talento_humano'), novedadesController.crear);
router.put('/:id', rol('admin', 'talento_humano'), novedadesController.actualizar);
router.delete('/:id', rol('admin', 'talento_humano'), novedadesController.eliminar);

// Lectura para empleados (sus propias novedades)
router.get('/mios', novedadesController.mios);

export default router;