import type { Request, Response } from 'express';
import type { ObtenerSeguimientoQueryHandler } from '@modules/seguimiento/application/use-cases/obtener-seguimiento/obtener-seguimiento-query.handler';
import { SITUACION } from '@modules/seguimiento/domain/entities/seguimiento';
import { fmtDate, hoyISO } from '@modules/seguimiento/application/services/seguimiento-rules';

const obtener = async (req: Request, res: Response) => {
  try {
    const hoy = hoyISO();
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    const ayerISO = fmtDate(ayer);

    const filtros = {
      fecha_desde: (req.query.fecha_desde as string) || ayerISO,
      fecha_hasta: (req.query.fecha_hasta as string) || hoy,
      area: (req.query.area as string) || undefined,
      piso: (req.query.piso as string) || undefined,
      busqueda: (req.query.busqueda as string) || undefined,
      situacion: (req.query.situacion as string) || undefined,
      page: (req.query.page as string) || 1,
      pageSize: (req.query.pageSize as string) || undefined,
    };

    const situacionesValidas: string[] = Object.values(SITUACION);
    if (filtros.situacion && !situacionesValidas.includes(filtros.situacion)) {
      return res.status(400).json({
        mensaje:
          'situacion inválida. Valores: absence, missing_morning, missing_afternoon, unregistered_exit, open_day',
      });
    }

    const handler = req.container.resolve<ObtenerSeguimientoQueryHandler>(
      'obtenerSeguimientoQueryHandler'
    );
    const resultado = await handler.handle(filtros);
    res.json(resultado);
  } catch (error) {
    console.error('Error en /api/seguimiento:', error);
    res.status(500).json({ mensaje: 'Error al obtener el seguimiento de asistencia' });
  }
};

export default { obtener };