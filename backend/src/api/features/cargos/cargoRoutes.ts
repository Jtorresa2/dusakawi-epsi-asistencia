import { Router } from 'express';
import auth from '../middlewares/authMiddleware';
import rol from '../middlewares/rol';
import * as cargoController from '../controllers/cargoController';

const router: Router = Router();

// Obtener todos los cargos
router.get('/', auth, cargoController.obtenerTodos);

// Obtener un cargo por id
router.get('/:id', auth, cargoController.obtenerPorId);

// Crear un cargo
router.post('/', auth, rol('admin'), cargoController.crear);

// Actualizar un cargo
router.put('/:id', auth, rol('admin'), cargoController.actualizar);

// Eliminar un cargo
router.delete('/:id', auth, rol('admin'), cargoController.eliminar);

export default router;