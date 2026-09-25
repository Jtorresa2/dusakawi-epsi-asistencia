import type { Request, Response } from 'express';
import type { ObtenerRegistrosHandler } from '@modules/asistencia/application/use-cases/obtener-registros/obtener-registros.handler';
import type { RegistrarManualHandler } from '@modules/asistencia/application/use-cases/registrar-manual/registrar-manual.handler';
import type { MarcarHandler } from '@modules/asistencia/application/use-cases/marcar/marcar.handler';
import type { ObtenerMiAsistenciaHandler } from '@modules/asistencia/application/use-cases/obtener-mi-asistencia/obtener-mi-asistencia.handler';
import type { JustificarAusenciaHandler } from '@modules/asistencia/application/use-cases/justificar-ausencia/justificar-ausencia.handler';
import type { EliminarRegistroHandler } from '@modules/asistencia/application/use-cases/eliminar-registro/eliminar-registro.handler';
import type { ActualizarRegistroHandler } from '@modules/asistencia/application/use-cases/actualizar-registro/actualizar-registro.handler';

const getRegistros = async (req: Request, res: Response) => {
  try {
    const { fecha, fecha_desde, fecha_hasta, area, piso, estado } = req.query;

    const handler = req.container.resolve<ObtenerRegistrosHandler>('obtenerRegistrosHandler');
    const resultado = await handler.handle({
      fecha: fecha as string | undefined,
      fecha_desde: fecha_desde as string | undefined,
      fecha_hasta: fecha_hasta as string | undefined,
      area: area as string | undefined,
      piso: piso as string | undefined,
      estado: estado as string | undefined,
    });
    res.json(resultado);
  } catch (err) {
    console.error('Error en getRegistros:', err);
    res.status(500).json({ mensaje: 'Error del servidor', error: (err as Error).message });
  }
};

const registrarManual = async (req: Request, res: Response) => {
  try {
    const { empleado_id, fecha, entrada1, salida1, entrada2, salida2, tipo_marcacion, observacion } = req.body;

    if (!empleado_id || !fecha) {
      return res.status(400).json({ mensaje: 'Empleado y fecha son obligatorios' });
    }

    const handler = req.container.resolve<RegistrarManualHandler>('registrarManualHandler');
    const resultado = await handler.handle({ empleado_id, fecha, entrada1, salida1, entrada2, salida2, tipo_marcacion, observacion });
    res.status(201).json(resultado);
  } catch (err) {
    console.error('Error en registrarManual:', err);
    res.status(500).json({ mensaje: 'Error del servidor', error: (err as Error).message });
  }
};

const marcar = async (req: Request, res: Response) => {
  try {
    const empleado_id = req.body.empleado_id || req.user?.empleado_id || req.user?.id;
    if (!empleado_id) {
      return res.status(400).json({ mensaje: 'Empleado no identificado' });
    }

    const handler = req.container.resolve<MarcarHandler>('marcarHandler');
    const resultado = await handler.handle({ empleado_id });

    if (resultado.tipo === 'completadas') {
      return res.status(400).json({ mensaje: 'Todas las marcaciones del día han sido completadas' });
    }

    res.json({
      mensaje: resultado.mensaje,
      id: resultado.id,
      casilla: resultado.casilla,
      hora: resultado.hora,
    });
  } catch (err) {
    console.error('Error en marcar:', err);
    res.status(500).json({ mensaje: 'Error del servidor', error: (err as Error).message });
  }
};

const getMiAsistencia = async (req: Request, res: Response) => {
  try {
    const mes = parseInt(String(req.query.mes || (new Date().getMonth() + 1)), 10);
    const anio = parseInt(String(req.query.anio || new Date().getFullYear()), 10);
    const empleado_id = req.user?.empleado_id || req.user?.id;

    if (!empleado_id) {
      return res.status(400).json({ mensaje: 'Empleado no identificado' });
    }

    const handler = req.container.resolve<ObtenerMiAsistenciaHandler>('obtenerMiAsistenciaHandler');
    const resultado = await handler.handle({ mes, anio, empleado_id });
    res.json(resultado);
  } catch (err) {
    console.error('Error en getMiAsistencia:', err);
    res.status(500).json({ mensaje: 'Error del servidor', error: (err as Error).message });
  }
};

const justificarAusencia = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params;
    const { observacion, motivo, tipo } = req.body;

    const handler = req.container.resolve<JustificarAusenciaHandler>('justificarAusenciaHandler');
    const resultado = await handler.handle({ id, observacion, motivo, tipo });
    res.json(resultado);
  } catch (err) {
    console.error('Error en justificarAusencia:', err);
    res.status(500).json({ mensaje: 'Error del servidor', error: (err as Error).message });
  }
};

const eliminarRegistro = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params;

    const handler = req.container.resolve<EliminarRegistroHandler>('eliminarRegistroHandler');
    const resultado = await handler.handle({ id });
    res.json(resultado);
  } catch (err) {
    console.error('Error en eliminarRegistro:', err);
    res.status(500).json({ mensaje: 'Error del servidor', error: (err as Error).message });
  }
};

const actualizarRegistro = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params;
    const { entrada1, salida1, entrada2, salida2, fecha, tipo_marcacion, estado, observacion } = req.body;

    const handler = req.container.resolve<ActualizarRegistroHandler>('actualizarRegistroHandler');
    const resultado = await handler.handle({ id, entrada1, salida1, entrada2, salida2, fecha, tipo_marcacion, estado, observacion });
    res.json(resultado);
  } catch (err) {
    console.error('Error en actualizarRegistro:', err);
    res.status(500).json({ mensaje: 'Error del servidor', error: (err as Error).message });
  }
};

export default {
  getRegistros,
  registrarManual,
  marcar,
  getMiAsistencia,
  justificarAusencia,
  eliminarRegistro,
  actualizarRegistro,
};