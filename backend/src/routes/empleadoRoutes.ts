import { Router } from 'express';
import auth from '../middlewares/authMiddleware';
import rol from '../middlewares/rol';
import * as empleadoController from '../controllers/empleadoController';

const router: Router = Router();

// Backward-compat surface: /api/empleados delegates to personalService.
// GET: any authenticated user (personal list / own profile flows).
// PUT allows self-edit for any authenticated user; admin/TH may edit others;
// rol_id changes are admin-only (enforced in the controller).
// POST/DELETE: only admin and talento_humano (same as /api/usuarios).
router.get('/', auth, empleadoController.obtenerTodos);
router.get('/:id', auth, empleadoController.obtenerPorId);
router.post('/', auth, rol('admin', 'talento_humano'), empleadoController.crear);
router.put('/:id', auth, empleadoController.actualizar);
router.delete('/:id', auth, rol('admin', 'talento_humano'), empleadoController.eliminar);

export default router;