import type { Request, Response } from 'express';
import type { GetConfigQueryHandler } from '@modules/config/application/use-cases/get-config/get-config-query.handler';
import type { UpdateConfigCommandHandler } from '@modules/config/application/use-cases/update-config/update-config-command.handler';
import type { BackupDbCommandHandler } from '@modules/config/application/use-cases/backup-db/backup-db-command.handler';

const obtenerConfig = async (_req: Request, res: Response) => {
  try {
    const handler = _req.container.resolve<GetConfigQueryHandler>(
      'getConfigQueryHandler',
    );

    const config = await handler.handle();
    res.json(config);
  } catch (error) {
    console.error('Error al obtener config:', error);
    res.status(500).json({ mensaje: 'Error al cargar configuración' });
  }
};

const actualizarConfig = async (req: Request, res: Response) => {
  try {
    const entries = req.body ?? {};
    if (Object.keys(entries).length === 0) {
      return res.status(400).json({ mensaje: 'No hay datos para guardar' });
    }

    const handler = req.container.resolve<UpdateConfigCommandHandler>(
      'updateConfigCommandHandler',
    );

    const resultado = await handler.handle({ entries });
    res.json(resultado);
  } catch (error) {
    console.error('Error al guardar config:', error);
    res.status(500).json({ mensaje: 'Error al guardar configuración' });
  }
};

const respaldarBD = async (_req: Request, res: Response) => {
  try {
    const handler = _req.container.resolve<BackupDbCommandHandler>(
      'backupDbCommandHandler',
    );

    const resultado = await handler.handle();
    res.json(resultado);
  } catch (error) {
    console.error('Error al generar respaldo:', error);
    res.status(500).json({ mensaje: 'Error al generar respaldo' });
  }
};

export default { obtenerConfig, actualizarConfig, respaldarBD };