import { asClass, type AwilixContainer } from 'awilix';
import { GetDailyReportHandler } from '@modules/reportes/application/use-cases/get-daily-report/get-daily-report.handler';
import { GetMonthlyReportHandler } from '@modules/reportes/application/use-cases/get-monthly-report/get-monthly-report.handler';
import { GetIndicatorsHandler } from '@modules/reportes/application/use-cases/get-indicators/get-indicators.handler';
import { GetTrendHandler } from '@modules/reportes/application/use-cases/get-trend/get-trend.handler';
import { GetAttendanceReportHandler } from '@modules/reportes/application/use-cases/get-attendance-report/get-attendance-report.handler';
import { GetIncidentsReportHandler } from '@modules/reportes/application/use-cases/get-incidents-report/get-incidents-report.handler';
import { GetLateArrivalsReportHandler } from '@modules/reportes/application/use-cases/get-late-arrivals-report/get-late-arrivals-report.handler';
import { GetAbsencesReportHandler } from '@modules/reportes/application/use-cases/get-absences-report/get-absences-report.handler';
import { GetEmployeeReportHandler } from '@modules/reportes/application/use-cases/get-employee-report/get-employee-report.handler';
import { GetEmployeesReportHandler } from '@modules/reportes/application/use-cases/get-employees-report/get-employees-report.handler';
import { GetMarkingsReportHandler } from '@modules/reportes/application/use-cases/get-markings-report/get-markings-report.handler';
import { GetAreasReportHandler } from '@modules/reportes/application/use-cases/get-areas-report/get-areas-report.handler';
import { GetHistoryHandler } from '@modules/reportes/application/use-cases/get-history/get-history.handler';
import { SaveHistoryHandler } from '@modules/reportes/application/use-cases/save-history/save-history.handler';
import { PrismaReportRepository } from './persistence/repositories/prisma/prisma-report-repository';

export function registerReportsModule(container: AwilixContainer) {
  container.register({
    reportRepository: asClass(PrismaReportRepository).singleton(),
    getDailyReportHandler: asClass(GetDailyReportHandler).scoped(),
    getMonthlyReportHandler: asClass(GetMonthlyReportHandler).scoped(),
    getIndicatorsHandler: asClass(GetIndicatorsHandler).scoped(),
    getTrendHandler: asClass(GetTrendHandler).scoped(),
    getAttendanceReportHandler: asClass(GetAttendanceReportHandler).scoped(),
    getIncidentsReportHandler: asClass(GetIncidentsReportHandler).scoped(),
    getLateArrivalsReportHandler: asClass(GetLateArrivalsReportHandler).scoped(),
    getAbsencesReportHandler: asClass(GetAbsencesReportHandler).scoped(),
    getEmployeeReportHandler: asClass(GetEmployeeReportHandler).scoped(),
    getEmployeesReportHandler: asClass(GetEmployeesReportHandler).scoped(),
    getMarkingsReportHandler: asClass(GetMarkingsReportHandler).scoped(),
    getAreasReportHandler: asClass(GetAreasReportHandler).scoped(),
    getHistoryHandler: asClass(GetHistoryHandler).scoped(),
    saveHistoryHandler: asClass(SaveHistoryHandler).scoped(),
  });
}
