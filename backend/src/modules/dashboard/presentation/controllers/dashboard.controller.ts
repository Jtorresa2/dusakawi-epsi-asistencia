import type { Request, Response } from 'express';
import type { GetIndicadoresQueryHandler } from '@modules/dashboard/application/use-cases/get-indicadores/get-indicadores-query.handler';
import type { GetResumenPorAreaQueryHandler } from '@modules/dashboard/application/use-cases/get-resumen-por-area/get-resumen-por-area-query.handler';
import type { GetIndicadoresQueryDto } from '@modules/dashboard/application/use-cases/get-indicadores/get-indicadores-query.dto';

const getIndicadores = async (req: Request, res: Response) => {
  try {
    const handler = req.container.resolve<GetIndicadoresQueryHandler>(
      'getIndicadoresQueryHandler',
    );

    const query: GetIndicadoresQueryDto = {
      periodo: req.query.periodo as string,
    };

    const resultado = await handler.handle(query);
    res.json(resultado);
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      mensaje: 'Error del servidor',
    });
  }
};

const getResumenPorArea = async (_req: Request, res: Response) => {
  try {
    const handler = _req.container.resolve<GetResumenPorAreaQueryHandler>(
      'getResumenPorAreaQueryHandler',
    );

    const resultado = await handler.handle();
    res.json(resultado);
  } catch (error) {
    console.error('Resumen por área error:', error);
    res.status(500).json({
      mensaje: 'Error del servidor',
    });
  }
};

export default { getIndicadores, getResumenPorArea };