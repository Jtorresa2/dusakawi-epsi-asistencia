import { Router } from 'express';
import auth from '../middlewares/authMiddleware';
import rol from '../middlewares/rol';
import * as horarioController from '../controllers/horarioController';

const router: Router = Router();

router.get('/', auth, horarioController.obtenerTodos);
router.post('/asignar', auth, rol('admin', 'talento_humano'), horarioController.asignar);
router.post('/asignar-masivo', auth, rol('admin', 'talento_humano'), horarioController.asignarMasivo);
router.post('/desasignar', auth, rol('admin', 'talento_humano'), horarioController.desasignar);
router.post('/:id/por-defecto', auth, rol('admin'), horarioController.porDefecto);
router.get('/usuarios/:usuarioId/historial', auth, rol('admin', 'talento_humano'), horarioController.historial);
router.get('/mi-horario', auth, horarioController.miHorario);
router.get('/historial-global', auth, rol('admin', 'talento_humano'), horarioController.historialGlobal);
router.get('/:id/asignados', auth, rol('admin', 'talento_humano'), horarioController.asignados);
router.get('/:id', auth, horarioController.obtenerPorId);
router.post('/', auth, rol('admin'), horarioController.crear);
router.put('/:id', auth, rol('admin'), horarioController.actualizar);
router.delete('/:id', auth, rol('admin'), horarioController.eliminar);

export default router;