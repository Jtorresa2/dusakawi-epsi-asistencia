import { Router } from 'express';
import { registrarMarcacion } from '../controllers/marcacionController';

const router: Router = Router();

// No requiere auth por ahora — el dispositivo biométrico no tiene token.
// Cuando se implemente auth por dispositivo, se agrega el middleware.
router.post('/', registrarMarcacion);

export default router;