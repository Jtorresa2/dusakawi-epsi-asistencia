import type { Request, Response } from 'express';
import type { GetNovedadesQueryHandler } from '@modules/novedades/application/use-cases/get-novedades/get-novedades-query.handler';
import type { GetNovedadesPorEmpleadoQueryHandler } from '@modules/novedades/application/use-cases/get-novedades-por-empleado/get-novedades-por-empleado-query.handler';
import type { CreateNovedadCommandHandler } from '@modules/novedades/application/use-cases/create-novedad/create-novedad-command.handler';
import type { UpdateNovedadCommandHandler } from '@modules/novedades/application/use-cases/update-novedad/update-novedad-command.handler';
import type { DeleteNovedadCommandHandler } from '@modules/novedades/application/use-cases/delete-novedad/delete-novedad-command.handler';

const obtenerTodos = async (req: Request, res: Response) => {
  try {
    const handler = req.container.resolve<GetNovedadesQueryHandler>('getNovedadesQueryHandler');
    const novedades = await handler.handle();
    res.json({ novedades });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error al obtener las novedades' });
  }
};

const crear = async (req: Request, res: Response) => {
  try {
    const usuarioId = req.user?.id ?? null;
    const handler = req.container.resolve<CreateNovedadCommandHandler>('createNovedadCommandHandler');
    const result = await handler.handle({ data: req.body, usuarioId });
    res.status(201).json({
      mensaje: 'Novedad registrada correctamente',
      id: result.id,
      dias_generados: result.dias_generados,
    });
  } catch (err) {
    console.error(err);
    const message = (err as Error).message;
    if (message.includes('requeridos')) {
      return res.status(400).json({ mensaje: message });
    }
    res.status(500).json({ mensaje: 'Error al registrar la novedad' });
  }
};

const actualizar = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params;
    const usuarioId = req.user?.id ?? null;
    const handler = req.container.resolve<UpdateNovedadCommandHandler>('updateNovedadCommandHandler');
    await handler.handle({ id, data: req.body, usuarioId });
    res.json({ mensaje: 'Novedad actualizada correctamente' });
  } catch (err) {
    console.error(err);
    const message = (err as Error).message;
    if (message.includes('requeridos')) {
      return res.status(400).json({ mensaje: message });
    }
    res.status(500).json({ mensaje: 'Error al actualizar la novedad' });
  }
};

const eliminar = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const handler = req.container.resolve<DeleteNovedadCommandHandler>('deleteNovedadCommandHandler');
    await handler.handle({ id: req.params.id });
    res.json({ mensaje: 'Novedad eliminada correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error al eliminar la novedad' });
  }
};

const mios = async (req: Request, res: Response) => {
  try {
    const empleadoId = req.user?.empleado_id || req.user?.id;
    if (!empleadoId) return res.status(400).json({ mensaje: 'empleado_id no encontrado' });
    const handler = req.container.resolve<GetNovedadesPorEmpleadoQueryHandler>('getNovedadesPorEmpleadoQueryHandler');
    const novedades = await handler.handle({ empleadoId });
    res.json({ novedades });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error al obtener mis novedades' });
  }
};

export default { obtenerTodos, crear, actualizar, eliminar, mios };