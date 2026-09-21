import { Router } from 'express';
import auth from '../middlewares/authMiddleware';
import rol from '../middlewares/rol';
import * as areaController from '../controllers/areaController';

const router: Router = Router();

// Lectura: cualquier usuario autenticado
router.get('/', auth, areaController.obtenerTodos);
router.get('/:id', auth, areaController.obtenerPorId);
router.get('/:id/empleados', auth, areaController.obtenerEmpleadosPorArea);

// Escritura: solo admin y talento_humano
router.post('/', auth, rol('admin', 'talento_humano'), areaController.crear);
router.put('/:id', auth, rol('admin', 'talento_humano'), areaController.actualizar);
router.delete('/:id', auth, rol('admin', 'talento_humano'), areaController.eliminar);

export default router;