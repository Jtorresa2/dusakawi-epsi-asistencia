import type { Request, Response } from 'express';
import type { GetEmpleadosQueryHandler } from '@modules/empleados/application/use-cases/get-empleados/get-empleados-query.handler';
import type { GetEmpleadoQueryHandler } from '@modules/empleados/application/use-cases/get-empleado/get-empleado-query.handler';
import type { CreateEmpleadoCommandHandler } from '@modules/empleados/application/use-cases/create-empleado/create-empleado-command.handler';
import type { UpdateEmpleadoCommandHandler } from '@modules/empleados/application/use-cases/update-empleado/update-empleado-command.handler';
import type { DeleteEmpleadoCommandHandler } from '@modules/empleados/application/use-cases/delete-empleado/delete-empleado-command.handler';

// El adapter pg de Prisma traduce violaciones de PostgreSQL a P2010 con el
// SQLSTATE original en meta.driverAdapterError (p.ej. UniqueConstraintViolation
// para 23505 y ForeignKeyViolation para 23503). El legacy usaba pg directo y
// recibía code === '23505'/'23503'; acá se aceptan ambos formatos.
const esViolacion = (error: unknown, sqlState: '23505' | '23503'): boolean => {
  const e = error as {
    code?: string;
    cause?: { code?: string };
    meta?: { driverAdapterError?: unknown };
  };
  if (e.code === sqlState || e.cause?.code === sqlState) return true;
  if (sqlState === '23505' && e.code === 'P2002') return true;
  if (sqlState === '23503' && e.code === 'P2003') return true;
  if (e.code === 'P2010') {
    const label = sqlState === '23505' ? 'UniqueConstraintViolation' : 'ForeignKeyViolation';
    if (String(e.meta?.driverAdapterError ?? '').includes(label)) return true;
  }
  return false;
};

const obtenerTodos = async (req: Request, res: Response) => {
  try {
    const handler = req.container.resolve<GetEmpleadosQueryHandler>(
      'getEmpleadosQueryHandler',
    );

    const filtros: Record<string, string> = {};
    if (req.query.area) filtros.area = String(req.query.area);
    if (req.query.cargo) filtros.cargo = String(req.query.cargo);

    const empleados = await handler.handle(filtros);
    res.json({ empleados });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener los empleados' });
  }
};

const obtenerPorId = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const handler = req.container.resolve<GetEmpleadoQueryHandler>(
      'getEmpleadoQueryHandler',
    );

    const empleado = await handler.handle({ id: req.params.id });
    if (!empleado) return res.status(404).json({ mensaje: 'Empleado no encontrado' });
    res.json(empleado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener el empleado' });
  }
};

const crear = async (req: Request, res: Response) => {
  console.log('[CREAR EMPLEADO] body:', JSON.stringify(req.body, null, 2));
  try {
    const handler = req.container.resolve<CreateEmpleadoCommandHandler>(
      'createEmpleadoCommandHandler',
    );

    const { id } = await handler.handle({ data: req.body ?? {} });
    console.log('[CREAR EMPLEADO] OK:', id);
    res.status(201).json({ mensaje: 'Empleado creado correctamente', id });
  } catch (error) {
    console.error('[CREAR EMPLEADO] ERROR:', error);
    if (esViolacion(error, '23505')) {
      return res.status(400).json({ mensaje: 'La cédula o correo ya están registrados' });
    }
    res.status(500).json({ mensaje: 'Error al crear el empleado', error: String(error) });
  }
};

const actualizar = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const handler = req.container.resolve<UpdateEmpleadoCommandHandler>(
      'updateEmpleadoCommandHandler',
    );

    await handler.handle({ id: req.params.id, data: req.body ?? {} });
    res.json({ mensaje: 'Empleado actualizado correctamente' });
  } catch (error) {
    console.error('[ACTUALIZAR EMPLEADO ERROR]', error);
    res.status(500).json({ mensaje: 'Error al actualizar el empleado', error: String(error) });
  }
};

const eliminar = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const handler = req.container.resolve<DeleteEmpleadoCommandHandler>(
      'deleteEmpleadoCommandHandler',
    );

    await handler.handle({ id: req.params.id });
    res.json({ mensaje: 'Empleado eliminado correctamente' });
  } catch (error) {
    console.error(error);
    if (esViolacion(error, '23503')) {
      return res.status(400).json({ mensaje: 'No se puede eliminar el empleado porque tiene registros asociados' });
    }
    res.status(500).json({ mensaje: 'Error al eliminar el empleado' });
  }
};

export default { obtenerTodos, obtenerPorId, crear, actualizar, eliminar };