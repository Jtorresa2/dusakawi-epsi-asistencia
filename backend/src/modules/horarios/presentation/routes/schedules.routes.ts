import { createRequire } from 'node:module';
import { Router } from 'express';
import schedulesController from '../controllers/schedules.controller';

const require = createRequire(import.meta.url);
const auth = require('../../../../middlewares/authMiddleware.js');

const schedulesRouter = Router();

schedulesRouter.get('/', auth, schedulesController.getSchedules);
schedulesRouter.get('/mi-horario', auth, schedulesController.getMySchedule);
schedulesRouter.post('/asignar', auth, schedulesController.assignSchedule);
schedulesRouter.post('/asignar-masivo', auth, schedulesController.massAssignSchedule);
schedulesRouter.post('/desasignar', auth, schedulesController.unassignSchedule);
schedulesRouter.get('/historial-global', auth, schedulesController.getGlobalAssignmentHistory);
schedulesRouter.get(
  '/usuarios/:usuarioId/historial',
  auth,
  schedulesController.getUserAssignmentHistory,
);
schedulesRouter.get('/:id/asignados', auth, schedulesController.getAssignedUsers);
schedulesRouter.post('/:id/por-defecto', auth, schedulesController.setDefaultSchedule);
schedulesRouter.post('/', auth, schedulesController.createSchedule);
schedulesRouter.get('/:id', auth, schedulesController.getSchedule);
schedulesRouter.put('/:id', auth, schedulesController.updateSchedule);
schedulesRouter.delete('/:id', auth, schedulesController.deleteSchedule);

export default schedulesRouter;
