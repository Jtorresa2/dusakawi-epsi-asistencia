import { Router } from 'express';
import * as festivosController from '../controllers/festivosController';
import auth from '../middlewares/authMiddleware';
import rol from '../middlewares/rol';

const router: Router = Router();

router.use(auth);

router.get('/', festivosController.obtenerTodos);
router.get('/verificar', festivosController.verificar);
router.post('/', rol('admin', 'talento_humano'), festivosController.crear);
router.put('/:id', rol('admin', 'talento_humano'), festivosController.actualizar);
router.delete('/:id', rol('admin', 'talento_humano'), festivosController.eliminar);
router.post('/generar', rol('admin', 'talento_humano'), festivosController.generar);

export default router;