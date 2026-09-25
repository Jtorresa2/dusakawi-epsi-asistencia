import type { Request, Response } from 'express';
import type { CrearIncidenciaCommandHandler } from '@modules/incidencias/application/use-cases/crear-incidencia/crear-incidencia-command.handler';
import type { GetIncidenciasQueryHandler } from '@modules/incidencias/application/use-cases/get-incidencias/get-incidencias-query.handler';
import type { GetIncidenciaPorIdQueryHandler } from '@modules/incidencias/application/use-cases/get-incidencia-por-id/get-incidencia-por-id-query.handler';
import type { AprobarIncidenciaCommandHandler } from '@modules/incidencias/application/use-cases/aprobar-incidencia/aprobar-incidencia-command.handler';
import type { AprobarIncidenciaConFirmaCommandHandler } from '@modules/incidencias/application/use-cases/aprobar-incidencia-con-firma/aprobar-incidencia-con-firma-command.handler';
import type { RechazarIncidenciaCommandHandler } from '@modules/incidencias/application/use-cases/rechazar-incidencia/rechazar-incidencia-command.handler';
import type { SolicitarCorreccionIncidenciaCommandHandler } from '@modules/incidencias/application/use-cases/solicitar-correccion-incidencia/solicitar-correccion-incidencia-command.handler';
import type { EliminarIncidenciaCommandHandler } from '@modules/incidencias/application/use-cases/eliminar-incidencia/eliminar-incidencia-command.handler';
import type { GetStatsIncidenciasQueryHandler } from '@modules/incidencias/application/use-cases/get-stats-incidencias/get-stats-incidencias-query.handler';
import type { GetActividadIncidenciasQueryHandler } from '@modules/incidencias/application/use-cases/get-actividad-incidencias/get-actividad-incidencias-query.handler';

const crear = async (req: Request, res: Response) => {
  try {
    const { tipo, descripcion, fecha, prioridad } = req.body || {};
    const empleado_id = (req.user?.empleado_id || req.user?.id) as string;
    const archivo = (req as Request & { file?: { filename: string } }).file;
    const evidencia_url = archivo ? `/uploads/incidencias/${archivo.filename}` : null;
    const handler = req.container.resolve<CrearIncidenciaCommandHandler>('crearIncidenciaCommandHandler');
    const result = await handler.handle({ data: { empleado_id, tipo, descripcion, evidencia_url, fecha, prioridad } });
    res.status(201).json({ mensaje: 'Incidencia reportada correctamente', id: result.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error al reportar la incidencia' });
  }
};

const obtenerTodas = async (req: Request, res: Response) => {
  try {
    const filtros: Record<string, string> = {};
    if (req.user?.rol === 'empleado') filtros.empleado_id = (req.user?.empleado_id || req.user?.id) as string;
    if (req.query.estado) filtros.estado = String(req.query.estado);
    if (req.query.tipo) filtros.tipo = String(req.query.tipo);
    if (req.query.prioridad) filtros.prioridad = String(req.query.prioridad);
    if (req.query.area_id) filtros.area_id = String(req.query.area_id);
    if (req.query.cargo_id) filtros.cargo_id = String(req.query.cargo_id);
    if (req.query.fecha_desde) filtros.fecha_desde = String(req.query.fecha_desde);
    if (req.query.fecha_hasta) filtros.fecha_hasta = String(req.query.fecha_hasta);
    if (req.query.busqueda) filtros.busqueda = String(req.query.busqueda);
    const handler = req.container.resolve<GetIncidenciasQueryHandler>('getIncidenciasQueryHandler');
    const incidencias = await handler.handle(filtros);
    res.json(incidencias);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error al obtener incidencias' });
  }
};

const obtenerPorId = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const handler = req.container.resolve<GetIncidenciaPorIdQueryHandler>('getIncidenciaPorIdQueryHandler');
    const incidencia = await handler.handle({ id: req.params.id });
    if (!incidencia) return res.status(404).json({ mensaje: 'Incidencia no encontrada' });
    if (req.user?.rol === 'empleado' && incidencia.empleado_id !== (req.user?.empleado_id || req.user?.id)) {
      return res.status(403).json({ mensaje: 'No tienes permiso' });
    }
    res.json(incidencia);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error al obtener la incidencia' });
  }
};

const aprobar = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { observacion } = req.body || {};
    const handler = req.container.resolve<AprobarIncidenciaCommandHandler>('aprobarIncidenciaCommandHandler');
    const ok = await handler.handle({ id: req.params.id, revisadoPor: req.user?.id as string, observacion });
    if (!ok) return res.status(400).json({ mensaje: 'No se pudo aprobar. Puede que ya no esté pendiente.' });
    res.json({ mensaje: 'Incidencia aprobada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error al aprobar la incidencia' });
  }
};

const rechazar = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { motivo } = req.body || {};
    if (!motivo) return res.status(400).json({ mensaje: 'Debes indicar el motivo del rechazo' });
    const handler = req.container.resolve<RechazarIncidenciaCommandHandler>('rechazarIncidenciaCommandHandler');
    const ok = await handler.handle({ id: req.params.id, motivo, revisadoPor: req.user?.id as string });
    if (!ok) return res.status(400).json({ mensaje: 'No se pudo rechazar. Puede que ya no esté pendiente.' });
    res.json({ mensaje: 'Incidencia rechazada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error al rechazar la incidencia' });
  }
};

const aprobarConFirma = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const archivo = (req as Request & { file?: { filename: string } }).file;
    const archivo_firmado = archivo ? `/uploads/incidencias/firmas/${archivo.filename}` : null;
    if (!archivo_firmado) return res.status(400).json({ mensaje: 'Debes adjuntar el PDF firmado' });
    const handler = req.container.resolve<AprobarIncidenciaConFirmaCommandHandler>('aprobarIncidenciaConFirmaCommandHandler');
    const ok = await handler.handle({ id: req.params.id, archivoFirmado: archivo_firmado, revisadoPor: req.user?.id as string });
    if (!ok) return res.status(400).json({ mensaje: 'No se pudo aprobar. Puede que ya no esté pendiente.' });
    res.json({ mensaje: 'Incidencia aprobada con firma' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error al aprobar con firma' });
  }
};

const solicitarCorreccion = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { observacion } = req.body || {};
    if (!observacion) return res.status(400).json({ mensaje: 'Debes indicar una observación' });
    const handler = req.container.resolve<SolicitarCorreccionIncidenciaCommandHandler>('solicitarCorreccionIncidenciaCommandHandler');
    const ok = await handler.handle({ id: req.params.id, observacion, revisadoPor: req.user?.id as string });
    if (!ok) return res.status(400).json({ mensaje: 'No se pudo solicitar corrección. Puede que ya no esté pendiente.' });
    res.json({ mensaje: 'Corrección solicitada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error al solicitar corrección' });
  }
};

const eliminar = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const handler = req.container.resolve<EliminarIncidenciaCommandHandler>('eliminarIncidenciaCommandHandler');
    await handler.handle({ id: req.params.id });
    res.json({ mensaje: 'Incidencia eliminada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error al eliminar la incidencia' });
  }
};

const obtenerStats = async (req: Request, res: Response) => {
  try {
    const handler = req.container.resolve<GetStatsIncidenciasQueryHandler>('getStatsIncidenciasQueryHandler');
    const stats = await handler.handle();
    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error al obtener estadísticas' });
  }
};

const obtenerActividad = async (req: Request, res: Response) => {
  try {
    const handler = req.container.resolve<GetActividadIncidenciasQueryHandler>('getActividadIncidenciasQueryHandler');
    const actividad = await handler.handle();
    res.json(actividad);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error al obtener actividad' });
  }
};

export default { crear, obtenerTodas, obtenerPorId, aprobar, rechazar, aprobarConFirma, solicitarCorreccion, eliminar, obtenerStats, obtenerActividad };