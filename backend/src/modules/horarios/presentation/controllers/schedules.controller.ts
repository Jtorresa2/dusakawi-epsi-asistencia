import type { Request, Response } from 'express';
import type { GetSchedulesHandler } from '@modules/horarios/application/use-cases/get-schedules/get-schedules.handler';
import type { GetScheduleHandler } from '@modules/horarios/application/use-cases/get-schedule/get-schedule.handler';
import type { CreateScheduleHandler } from '@modules/horarios/application/use-cases/create-schedule/create-schedule.handler';
import type { UpdateScheduleHandler } from '@modules/horarios/application/use-cases/update-schedule/update-schedule.handler';
import type { DeleteScheduleHandler } from '@modules/horarios/application/use-cases/delete-schedule/delete-schedule.handler';
import type { AssignScheduleHandler } from '@modules/horarios/application/use-cases/assign-schedule/assign-schedule.handler';
import type { MassAssignScheduleHandler } from '@modules/horarios/application/use-cases/mass-assign-schedule/mass-assign-schedule.handler';
import type { UnassignScheduleHandler } from '@modules/horarios/application/use-cases/unassign-schedule/unassign-schedule.handler';
import type { SetDefaultScheduleHandler } from '@modules/horarios/application/use-cases/set-default-schedule/set-default-schedule.handler';
import type { GetAssignedUsersHandler } from '@modules/horarios/application/use-cases/get-assigned-users/get-assigned-users.handler';
import type { GetMyScheduleHandler } from '@modules/horarios/application/use-cases/get-my-schedule/get-my-schedule.handler';
import type { GetUserAssignmentHistoryHandler } from '@modules/horarios/application/use-cases/get-user-assignment-history/get-user-assignment-history.handler';
import type { GetGlobalAssignmentHistoryHandler } from '@modules/horarios/application/use-cases/get-global-assignment-history/get-global-assignment-history.handler';
import type { ScheduleAssignmentFilters } from '@modules/horarios/domain/entities/schedule';

const serverError = (res: Response, error: unknown) =>
  res.status(500).json({ mensaje: 'Error del servidor', error: (error as Error).message });

const getSchedules = async (req: Request, res: Response) => {
  try {
    const handler = req.container.resolve<GetSchedulesHandler>('getSchedulesHandler');
    res.json(await handler.handle());
  } catch (error) {
    serverError(res, error);
  }
};

const getSchedule = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const handler = req.container.resolve<GetScheduleHandler>('getScheduleHandler');
    const schedule = await handler.handle(req.params.id);
    if (!schedule) return res.status(404).json({ mensaje: 'Horario no encontrado' });
    res.json(schedule);
  } catch (error) {
    serverError(res, error);
  }
};

const createSchedule = async (req: Request, res: Response) => {
  try {
    const handler = req.container.resolve<CreateScheduleHandler>('createScheduleHandler');
    const result = await handler.handle({
      name: req.body.nombre,
      modality: req.body.modalidad,
      workdayType: req.body.tipo_jornada,
      description: req.body.descripcion,
      expectedHours: req.body.horas_esperadas,
      toleranceMinutes: req.body.tolerancia_minutos,
      toleranceDepartureMinutes: req.body.tolerancia_salida_minutos,
      active: req.body.activo,
      details: req.body.detalles,
    });
    if (result.status === 'missing-name') {
      return res.status(400).json({ mensaje: 'El nombre es obligatorio' });
    }
    res.status(201).json({ mensaje: 'Horario creado correctamente', id: result.id });
  } catch (error) {
    serverError(res, error);
  }
};

const updateSchedule = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const handler = req.container.resolve<UpdateScheduleHandler>('updateScheduleHandler');
    await handler.handle(req.params.id, {
      name: req.body.nombre,
      toleranceMinutes: req.body.tolerancia_minutos,
      details: req.body.detalles,
      description: req.body.description,
      modality: req.body.modality,
      workdayType: req.body.workday_type,
    });
    res.json({ mensaje: 'Horario actualizado correctamente' });
  } catch (error) {
    serverError(res, error);
  }
};

const deleteSchedule = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const handler = req.container.resolve<DeleteScheduleHandler>('deleteScheduleHandler');
    const result = await handler.handle(req.params.id);
    if (result === 'invalid-id') return res.status(400).json({ mensaje: 'Id inválido' });
    if (result === 'not-found') return res.status(404).json({ mensaje: 'Horario no encontrado' });
    if (result === 'assigned') {
      return res.status(400).json({
        mensaje: 'No se puede eliminar: el horario tiene empleados asignados',
      });
    }
    res.json({ mensaje: 'Horario eliminado correctamente' });
  } catch (error) {
    serverError(res, error);
  }
};

const assignSchedule = async (req: Request, res: Response) => {
  try {
    const handler = req.container.resolve<AssignScheduleHandler>('assignScheduleHandler');
    const result = await handler.handle({
      userId: req.body.usuario_id,
      scheduleId: req.body.horario_id,
      validFrom: req.body.vigencia_desde,
      validUntil: req.body.vigencia_hasta,
      reason: req.body.motivo,
      assignedBy: req.user?.id,
    });
    if (result.status === 'missing-fields') {
      return res.status(400).json({ mensaje: 'usuario_id y horario_id son obligatorios' });
    }
    if (result.status === 'end-before-today') {
      return res.status(400).json({ mensaje: 'La vigencia hasta no puede ser anterior a hoy' });
    }
    if (result.status === 'end-before-start') {
      return res
        .status(400)
        .json({ mensaje: 'La vigencia hasta no puede ser anterior a la vigencia desde' });
    }
    if (result.status === 'user-not-found') {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }
    if (result.status === 'schedule-not-found') {
      return res.status(404).json({ mensaje: 'Horario no encontrado' });
    }
    res.status(201).json({ mensaje: 'Horario asignado correctamente' });
  } catch (error) {
    serverError(res, error);
  }
};

const massAssignSchedule = async (req: Request, res: Response) => {
  try {
    const handler = req.container.resolve<MassAssignScheduleHandler>('massAssignScheduleHandler');
    const filters = (req.body.filtros === undefined ? {} : req.body.filtros) as ScheduleAssignmentFilters;
    const result = await handler.handle({
      scheduleId: req.body.horario_id,
      filters,
      validFrom: req.body.vigencia_desde,
      validUntil: req.body.vigencia_hasta,
      reason: req.body.motivo,
      userIds: req.body.usuario_ids,
      assignedBy: req.user?.id,
    });
    if (result.status === 'missing-schedule') {
      return res.status(400).json({ mensaje: 'horario_id es obligatorio' });
    }
    if (result.status === 'invalid-user-ids') {
      return res.status(400).json({ mensaje: 'usuario_ids debe ser un arreglo de ids' });
    }
    if (result.status === 'end-before-today') {
      return res.status(400).json({ mensaje: 'La vigencia hasta no puede ser anterior a hoy' });
    }
    if (result.status === 'end-before-start') {
      return res
        .status(400)
        .json({ mensaje: 'La vigencia hasta no puede ser anterior a la vigencia desde' });
    }
    if (result.status === 'schedule-not-found') {
      return res.status(404).json({ mensaje: 'Horario no encontrado' });
    }
    res.status(200).json({
      mensaje: `Horario asignado a ${result.count} empleados correctamente`,
      cantidad: result.count,
    });
  } catch (error) {
    serverError(res, error);
  }
};

const unassignSchedule = async (req: Request, res: Response) => {
  try {
    const handler = req.container.resolve<UnassignScheduleHandler>('unassignScheduleHandler');
    const result = await handler.handle(req.body.usuario_id);
    if (result.status === 'missing-user') {
      return res.status(400).json({ mensaje: 'usuario_id es obligatorio' });
    }
    if (result.status === 'user-not-found') {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }
    res.status(200).json({ mensaje: 'Horario desasignado correctamente' });
  } catch (error) {
    serverError(res, error);
  }
};

const setDefaultSchedule = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const handler = req.container.resolve<SetDefaultScheduleHandler>('setDefaultScheduleHandler');
    const result = await handler.handle(req.params.id, req.body.es_por_defecto === true);
    if (result === 'invalid-id') return res.status(400).json({ mensaje: 'Id inválido' });
    if (result === 'not-found') return res.status(404).json({ mensaje: 'Horario no encontrado' });
    res.json({ mensaje: 'Horario por defecto actualizado' });
  } catch (error) {
    serverError(res, error);
  }
};

const getAssignedUsers = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const handler = req.container.resolve<GetAssignedUsersHandler>('getAssignedUsersHandler');
    const result = await handler.handle(req.params.id);
    if (result.status === 'invalid-id') return res.status(400).json({ mensaje: 'Id inválido' });
    if (result.status === 'schedule-not-found') {
      return res.status(404).json({ mensaje: 'Horario no encontrado' });
    }
    res.json(result.users);
  } catch (error) {
    serverError(res, error);
  }
};

const getMySchedule = async (req: Request, res: Response) => {
  try {
    const handler = req.container.resolve<GetMyScheduleHandler>('getMyScheduleHandler');
    const result = await handler.handle(req.user?.id);
    if (result.status === 'user-not-found') {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }
    if (result.status === 'unassigned') {
      return res.json({ asignado: false, mensaje: 'No tienes horario asignado' });
    }
    if (result.status === 'schedule-not-found') {
      return res.status(404).json({ mensaje: 'Horario no encontrado' });
    }
    res.json({ asignado: true, horario: result.schedule });
  } catch (error) {
    serverError(res, error);
  }
};

const getUserAssignmentHistory = async (
  req: Request<{ usuarioId: string }>,
  res: Response,
) => {
  try {
    const handler = req.container.resolve<GetUserAssignmentHistoryHandler>(
      'getUserAssignmentHistoryHandler',
    );
    const result = await handler.handle(req.params.usuarioId);
    if (result.status === 'invalid-id') return res.status(400).json({ mensaje: 'Id inválido' });
    res.json(result.history);
  } catch (error) {
    serverError(res, error);
  }
};

const getGlobalAssignmentHistory = async (_req: Request, res: Response) => {
  try {
    const handler = _req.container.resolve<GetGlobalAssignmentHistoryHandler>(
      'getGlobalAssignmentHistoryHandler',
    );
    res.json(await handler.handle());
  } catch (error) {
    serverError(res, error);
  }
};

export default {
  getSchedules,
  getSchedule,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  assignSchedule,
  massAssignSchedule,
  unassignSchedule,
  setDefaultSchedule,
  getAssignedUsers,
  getMySchedule,
  getUserAssignmentHistory,
  getGlobalAssignmentHistory,
};
