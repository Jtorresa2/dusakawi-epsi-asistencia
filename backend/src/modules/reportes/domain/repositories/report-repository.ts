import type {
  AbsenceRecord,
  AbsenceFilters,
  AttendanceRecord,
  AttendanceFilters,
  AreaReportRecord,
  AreaReportFilters,
  DailyRecord,
  DailySummary,
  EmployeeReportData,
  EmployeeReportFilters,
  EmployeeReportRecord,
  HistoryRow,
  IncidentRecord,
  IncidentFilters,
  IndicatorData,
  LateArrivalRecord,
  LateArrivalFilters,
  MarkingRecord,
  MarkingFilters,
  MonthlyReportData,
  SaveHistoryCommand,
  TrendRow,
} from '@modules/reportes/domain/entities/report';

export interface ReportRepository {
  getDailyRecords(date: string): Promise<DailyRecord[]>;
  getDailySummary(date: string): Promise<DailySummary[]>;
  getMonthlyReport(month: number, year: number): Promise<MonthlyReportData>;
  getIndicators(
    month: number,
    year: number,
    previousMonth: number,
    previousYear: number,
  ): Promise<IndicatorData>;
  getTrend(): Promise<TrendRow[]>;
  getAttendance(filters: AttendanceFilters): Promise<AttendanceRecord[]>;
  getIncidents(filters: IncidentFilters): Promise<IncidentRecord[]>;
  getLateArrivals(filters: LateArrivalFilters): Promise<LateArrivalRecord[]>;
  getAbsences(filters: AbsenceFilters): Promise<AbsenceRecord[]>;
  getEmployeeReport(
    employeeId: string,
    month: number,
    year: number,
  ): Promise<EmployeeReportData>;
  getEmployees(filters: EmployeeReportFilters): Promise<EmployeeReportRecord[]>;
  getMarkings(filters: MarkingFilters): Promise<MarkingRecord[]>;
  getAreas(filters: AreaReportFilters): Promise<AreaReportRecord[]>;
  getHistory(): Promise<HistoryRow[]>;
  saveHistory(command: SaveHistoryCommand): Promise<void>;
}
