import type { Request, Response } from 'express';
import type { GetFestivosQueryHandler } from '@modules/festivos/application/use-cases/get-festivos/get-festivos-query.handler';
import type { GetFestivoQueryHandler } from '@modules/festivos/application/use-cases/get-festivo/get-festivo-query.handler';
import type { CreateFestivoCommandHandler } from '@modules/festivos/application/use-cases/create-festivo/create-festivo-command.handler';
import type { UpdateFestivoCommandHandler } from '@modules/festivos/application/use-cases/update-festivo/update-festivo-command.handler';
import type { DeleteFestivoCommandHandler } from '@modules/festivos/application/use-cases/delete-festivo/delete-festivo-command.handler';
import type { VerifyFestivoQueryHandler } from '@modules/festivos/application/use-cases/verify-festivo/verify-festivo-query.handler';
import type { GenerateFestivosCommandHandler } from '@modules/festivos/application/use-cases/generate-festivos/generate-festivos-command.handler';

const obtenerTodos = async (req: Request, res: Response) => {
  try {
    const activo = req.query.activo !== undefined ? req.query.activo === 'true' : null;
    const handler = req.container.resolve<GetFestivosQueryHandler>('getFestivosQueryHandler');
    const festivos = await handler.handle({ activo });
    res.json({ festivos });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error del servidor', error: (err as Error).message });
  }
};

const crear = async (req: Request, res: Response) => {
  try {
    const { fecha, nombre, tipo } = req.body;
    if (!fecha || !nombre) {
      return res.status(400).json({ mensaje: 'fecha y nombre son requeridos' });
    }
    const handler = req.container.resolve<CreateFestivoCommandHandler>('createFestivoCommandHandler');
    const resultado = await handler.handle({ data: { fecha, nombre, tipo } });
    res.status(201).json({ mensaje: 'Festivo creado', festivo: resultado });
  } catch (err) {
    const e = err as { code?: string; message?: string };
    if (e.code === 'ER_DUP_ENTRY' || e.message?.includes('duplicate')) {
      return res.status(409).json({ mensaje: 'Ya existe un festivo en esa fecha' });
    }
    res.status(500).json({ mensaje: 'Error del servidor', error: e.message });
  }
};

const actualizar = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params;
    const handler = req.container.resolve<UpdateFestivoCommandHandler>('updateFestivoCommandHandler');
    const resultado = await handler.handle({ id, data: req.body ?? {} });
    res.json({ mensaje: 'Festivo actualizado', festivo: resultado });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error del servidor', error: (err as Error).message });
  }
};

const eliminar = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const handler = req.container.resolve<DeleteFestivoCommandHandler>('deleteFestivoCommandHandler');
    await handler.handle({ id: req.params.id });
    res.json({ mensaje: 'Festivo eliminado' });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error del servidor', error: (err as Error).message });
  }
};

const verificar = async (req: Request, res: Response) => {
  try {
    const { fecha } = req.query;
    if (!fecha) return res.status(400).json({ mensaje: 'fecha es requerida' });
    const handler = req.container.resolve<VerifyFestivoQueryHandler>('verifyFestivoQueryHandler');
    const festivo = await handler.handle({ fecha: String(fecha) });
    res.json({ esFestivo: !!festivo, festivo });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error del servidor', error: (err as Error).message });
  }
};

const generar = async (req: Request, res: Response) => {
  try {
    const { year } = req.body;
    if (!year) return res.status(400).json({ mensaje: 'Año es requerido' });
    const handler = req.container.resolve<GenerateFestivosCommandHandler>('generateFestivosCommandHandler');
    const resultado = await handler.handle({ year: Number(year) });
    res.json({
      mensaje: `Festivos generados: ${resultado.insertados} nuevo(s), ${resultado.existentes} ya existente(s)`,
      ...resultado,
    });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error del servidor', error: (err as Error).message });
  }
};

export default { obtenerTodos, crear, actualizar, eliminar, verificar, generar };