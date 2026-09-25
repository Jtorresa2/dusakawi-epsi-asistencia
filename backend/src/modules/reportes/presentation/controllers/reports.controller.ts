import type { Request, Response } from 'express';
import type { GetDailyReportHandler } from '@modules/reportes/application/use-cases/get-daily-report/get-daily-report.handler';
import type { GetMonthlyReportHandler } from '@modules/reportes/application/use-cases/get-monthly-report/get-monthly-report.handler';
import type { GetIndicatorsHandler } from '@modules/reportes/application/use-cases/get-indicators/get-indicators.handler';
import type { GetTrendHandler } from '@modules/reportes/application/use-cases/get-trend/get-trend.handler';
import type { GetAttendanceReportHandler } from '@modules/reportes/application/use-cases/get-attendance-report/get-attendance-report.handler';
import type { GetIncidentsReportHandler } from '@modules/reportes/application/use-cases/get-incidents-report/get-incidents-report.handler';
import type { GetLateArrivalsReportHandler } from '@modules/reportes/application/use-cases/get-late-arrivals-report/get-late-arrivals-report.handler';
import type { GetAbsencesReportHandler } from '@modules/reportes/application/use-cases/get-absences-report/get-absences-report.handler';
import type { GetEmployeeReportHandler } from '@modules/reportes/application/use-cases/get-employee-report/get-employee-report.handler';
import type { GetEmployeesReportHandler } from '@modules/reportes/application/use-cases/get-employees-report/get-employees-report.handler';
import type { GetMarkingsReportHandler } from '@modules/reportes/application/use-cases/get-markings-report/get-markings-report.handler';
import type { GetAreasReportHandler } from '@modules/reportes/application/use-cases/get-areas-report/get-areas-report.handler';
import type { GetHistoryHandler } from '@modules/reportes/application/use-cases/get-history/get-history.handler';
import type { SaveHistoryHandler } from '@modules/reportes/application/use-cases/save-history/save-history.handler';

const serverError = (res: Response, error: unknown) =>
  res.status(500).json({ mensaje: 'Error del servidor', error: (error as Error).message });

const getDaily = async (req: Request, res: Response) => {
  try {
    const date = (req.query.fecha as string | undefined) || new Date().toISOString().split('T')[0];
    const handler = req.container.resolve<GetDailyReportHandler>('getDailyReportHandler');
    res.json(await handler.handle(date));
  } catch (error) {
    console.error('get daily report error:', error);
    serverError(res, error);
  }
};

const getMonthly = async (req: Request, res: Response) => {
  try {
    const month = parseInt(
      (req.query.mes as string | undefined) || String(new Date().getMonth() + 1),
      10,
    );
    const year = parseInt(
      (req.query.anio as string | undefined) || String(new Date().getFullYear()),
      10,
    );
    const handler = req.container.resolve<GetMonthlyReportHandler>('getMonthlyReportHandler');
    res.json(await handler.handle(month, year));
  } catch (error) {
    console.error('get monthly report error:', error);
    serverError(res, error);
  }
};

const getIndicators = async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const previousMonth = month === 1 ? 12 : month - 1;
    const previousYear = month === 1 ? year - 1 : year;
    const handler = _req.container.resolve<GetIndicatorsHandler>('getIndicatorsHandler');
    res.json(await handler.handle(month, year, previousMonth, previousYear));
  } catch (error) {
    console.error('get indicators error:', error);
    serverError(res, error);
  }
};

const getTrend = async (req: Request, res: Response) => {
  try {
    const handler = req.container.resolve<GetTrendHandler>('getTrendHandler');
    res.json(await handler.handle());
  } catch (error) {
    console.error('get trend error:', error);
    serverError(res, error);
  }
};

const getAttendance = async (req: Request, res: Response) => {
  try {
    const handler = req.container.resolve<GetAttendanceReportHandler>('getAttendanceReportHandler');
    const result = await handler.handle({
      fecha_desde: req.query.fecha_desde as string | undefined,
      fecha_hasta: req.query.fecha_hasta as string | undefined,
      empleado_id: req.query.empleado_id as string | undefined,
      area_id: req.query.area_id as string | undefined,
      estado: req.query.estado as string | undefined,
    });
    res.json(result);
  } catch (error) {
    console.error('get attendance report error:', error);
    serverError(res, error);
  }
};

const getIncidents = async (req: Request, res: Response) => {
  try {
    const handler = req.container.resolve<GetIncidentsReportHandler>('getIncidentsReportHandler');
    const result = await handler.handle({
      fecha_desde: req.query.fecha_desde as string | undefined,
      fecha_hasta: req.query.fecha_hasta as string | undefined,
      estado: req.query.estado as string | undefined,
      tipo: req.query.tipo as string | undefined,
      area_id: req.query.area_id as string | undefined,
    });
    res.json(result);
  } catch (error) {
    console.error('get incidents report error:', error);
    serverError(res, error);
  }
};

const getLateArrivals = async (req: Request, res: Response) => {
  try {
    const handler = req.container.resolve<GetLateArrivalsReportHandler>('getLateArrivalsReportHandler');
    const result = await handler.handle({
      fecha_desde: req.query.fecha_desde as string | undefined,
      fecha_hasta: req.query.fecha_hasta as string | undefined,
      area_id: req.query.area_id as string | undefined,
      empleado_id: req.query.empleado_id as string | undefined,
    });
    res.json(result);
  } catch (error) {
    console.error('get late arrivals report error:', error);
    serverError(res, error);
  }
};

const getAbsences = async (req: Request, res: Response) => {
  try {
    const handler = req.container.resolve<GetAbsencesReportHandler>('getAbsencesReportHandler');
    const result = await handler.handle({
      fecha_desde: req.query.fecha_desde as string | undefined,
      fecha_hasta: req.query.fecha_hasta as string | undefined,
      area_id: req.query.area_id as string | undefined,
      empleado_id: req.query.empleado_id as string | undefined,
    });
    res.json(result);
  } catch (error) {
    console.error('get absences report error:', error);
    serverError(res, error);
  }
};

const getEmployee = async (req: Request, res: Response) => {
  try {
    const handler = req.container.resolve<GetEmployeeReportHandler>('getEmployeeReportHandler');
    const result = await handler.handle({
      employeeId: req.query.empleado_id as string | undefined,
      month: req.query.mes as string | undefined,
      year: req.query.anio as string | undefined,
    });
    if (result.status === 'missing-employee') {
      return res.status(400).json({ mensaje: 'empleado_id es requerido' });
    }
    if (result.status === 'not-found') {
      return res.status(404).json({ mensaje: 'Empleado no encontrado' });
    }
    res.json(result.response);
  } catch (error) {
    console.error('get employee report error:', error);
    serverError(res, error);
  }
};

const getEmployees = async (req: Request, res: Response) => {
  try {
    const handler = req.container.resolve<GetEmployeesReportHandler>('getEmployeesReportHandler');
    const result = await handler.handle({
      area_id: req.query.area_id as string | undefined,
      cargo_id: req.query.cargo_id as string | undefined,
    });
    res.json(result);
  } catch (error) {
    console.error('get employees report error:', error);
    serverError(res, error);
  }
};

const getMarkings = async (req: Request, res: Response) => {
  try {
    const handler = req.container.resolve<GetMarkingsReportHandler>('getMarkingsReportHandler');
    const result = await handler.handle({
      fecha_desde: req.query.fecha_desde as string | undefined,
      fecha_hasta: req.query.fecha_hasta as string | undefined,
      empleado_id: req.query.empleado_id as string | undefined,
      area_id: req.query.area_id as string | undefined,
    });
    res.json(result);
  } catch (error) {
    console.error('get markings report error:', error);
    serverError(res, error);
  }
};

const getAreas = async (req: Request, res: Response) => {
  try {
    const handler = req.container.resolve<GetAreasReportHandler>('getAreasReportHandler');
    const result = await handler.handle({
      area_id: req.query.area_id as string | undefined,
      empleado_id: req.query.empleado_id as string | undefined,
      usuario_id: req.query.usuario_id as string | undefined,
      mes: req.query.mes as string | undefined,
      anio: req.query.anio as string | undefined,
      estado: req.query.estado as string | undefined,
    });
    res.json(result);
  } catch (error) {
    console.error('get areas report error:', error);
    serverError(res, error);
  }
};

const getHistory = async (req: Request, res: Response) => {
  try {
    const handler = req.container.resolve<GetHistoryHandler>('getHistoryHandler');
    res.json(await handler.handle());
  } catch (error) {
    console.error('get history error:', error);
    serverError(res, error);
  }
};

const saveHistory = async (req: Request, res: Response) => {
  try {
    const handler = req.container.resolve<SaveHistoryHandler>('saveHistoryHandler');
    const user = req.user as { nombre?: string; username?: string } | undefined;
    const result = await handler.handle({
      type: req.body.tipo_reporte || req.body.tipo,
      userName: user?.nombre || user?.username || 'Desconocido',
      format: req.body.formato,
      filters: req.body.filtros,
      totalRecords: req.body.total_registros,
    });
    res.json(result);
  } catch (error) {
    console.error('save history error:', error);
    serverError(res, error);
  }
};

export default {
  getDaily,
  getMonthly,
  getIndicators,
  getTrend,
  getAttendance,
  getIncidents,
  getLateArrivals,
  getAbsences,
  getEmployee,
  getEmployees,
  getMarkings,
  getAreas,
  getHistory,
  saveHistory,
};
