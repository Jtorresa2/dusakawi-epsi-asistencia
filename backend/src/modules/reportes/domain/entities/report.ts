export type ReportValue = string | number | boolean | Date | null;

export type ReportRecord = Record<string, ReportValue>;

export interface DailyRecord extends ReportRecord {
  empleado: string;
  cedula: string;
  area: string;
  piso: string;
  fecha: string;
  entrada1: string | null;
  salida1: string | null;
  entrada2: string | null;
  salida2: string | null;
  horas_trabajadas: string;
  horas_extra: string;
  minutos_tardanza: number;
  tipo_marcacion: string;
  estado: string;
  observacion: string | null;
}

export interface DailySummary extends ReportRecord {
  total: string;
  puntuales: string;
  tardanzas: string;
  ausentes: string;
  justificados: string;
  porcentaje_asistencia: string;
  total_horas_extra: string;
  promedio_tardanza: string;
}

export interface HolidayRow extends ReportRecord {
  fecha: string;
  nombre: string;
}

export interface MonthlyDayRow extends ReportRecord {
  fecha: string;
  total: string;
  puntuales: string;
  tardanzas: string;
  ausentes: string;
  porcentaje_asistencia: string;
}

export interface MonthlyAreaRow extends ReportRecord {
  area: string;
  piso: string | null;
  total: string;
  puntuales: string;
  tardanzas: string;
  ausentes: string;
  porcentaje_asistencia: string;
}

export interface MonthlySummary extends ReportRecord {
  total_registros: string;
  puntuales: string | null;
  tardanzas: string | null;
  ausentes: string | null;
  total_horas_extra: string;
  porcentaje_asistencia: string | null;
  porcentaje_puntualidad: string | null;
}

export interface MonthlyReportData {
  holidays: HolidayRow[];
  days: MonthlyDayRow[];
  areas: MonthlyAreaRow[];
  summary: MonthlySummary[];
}

export interface IndicatorData {
  active: string;
  previousActive: string;
  attendance: string | null;
  previousAttendance: string | null;
  late: string;
  previousLate: string;
  incidents: string;
  previousIncidents: string;
  absences: string;
  previousAbsences: string;
  reports: string;
  previousReports: string;
}

export interface TrendRow extends ReportRecord {
  mes: string;
  anio: string;
  porcentaje: string | null;
}

export interface AttendanceFilters {
  fecha_desde?: string;
  fecha_hasta?: string;
  empleado_id?: string;
  area_id?: string;
  estado?: string;
}

export interface AttendanceRecord extends ReportRecord {
  id: string;
  cedula: string;
  empleado: string;
  area: string;
  piso: string;
  fecha: string;
  entrada1: string | null;
  salida1: string | null;
  entrada2: string | null;
  salida2: string | null;
  horas_trabajadas: string;
  horas_extra: string;
  minutos_tardanza: number;
  tipo_marcacion: string;
  estado: string;
  observacion: string | null;
}

export interface IncidentFilters {
  fecha_desde?: string;
  fecha_hasta?: string;
  estado?: string;
  tipo?: string;
  area_id?: string;
}

export interface IncidentRecord extends ReportRecord {
  id: string;
  tipo: string;
  descripcion: string;
  evidencia_url: string | null;
  estado: string;
  fecha: string;
  empleado: string;
  cedula: string;
  area: string;
  motivo_rechazo: string | null;
}

export interface LateArrivalFilters {
  fecha_desde?: string;
  fecha_hasta?: string;
  area_id?: string;
  empleado_id?: string;
}

export interface LateArrivalRecord extends ReportRecord {
  id: string;
  cedula: string;
  empleado: string;
  area: string;
  piso: string;
  fecha: string;
  entrada1: string | null;
  entrada2: string | null;
  minutos_tardanza: number;
  tipo_marcacion: string;
  observacion: string | null;
}

export interface AbsenceFilters {
  fecha_desde?: string;
  fecha_hasta?: string;
  area_id?: string;
  empleado_id?: string;
}

export interface AbsenceRecord extends ReportRecord {
  id: string;
  cedula: string;
  empleado: string;
  area: string;
  piso: string;
  fecha: string;
  estado: string;
  observacion: string | null;
  tipo_marcacion: string;
}

export interface EmployeeReportQuery {
  employeeId?: string;
  month?: string;
  year?: string;
}

export interface EmployeeRow extends ReportRecord {
  id: string;
  cedula: string;
  nombre: string;
  apellido: string;
  area: string;
  cargo: string;
  fecha_ingreso: string;
}

export interface HolidayCountRow extends ReportRecord {
  total: string;
}

export interface EmployeeSummaryRow extends ReportRecord {
  total_registros: string;
  puntuales: string | null;
  tardanzas: string | null;
  ausentes: string | null;
  justificados: string | null;
  horas_trabajadas: string;
  horas_extra: string;
  total_minutos_tardanza: string;
}

export interface PermitSummaryRow extends ReportRecord {
  total: string;
  dias_permiso: string;
}

export interface IncidentSummaryRow extends ReportRecord {
  total: string;
  pendientes: string;
}

export interface EmployeeDetailRow extends ReportRecord {
  fecha: string;
  estado: string;
  entrada1: string | null;
  salida1: string | null;
  entrada2: string | null;
  salida2: string | null;
  horas_trabajadas: string | null;
  horas_extra: string | null;
  minutos_tardanza: number | null;
  observacion: string | null;
}

export interface EmployeeReportData {
  employee: EmployeeRow | undefined;
  holidays: HolidayCountRow[];
  attendanceSummary: EmployeeSummaryRow[];
  permits: PermitSummaryRow[];
  incidents: IncidentSummaryRow[];
  detail: EmployeeDetailRow[];
  detailHolidays: HolidayRow[];
}

export interface EmployeeReportFilters {
  area_id?: string;
  cargo_id?: string;
}

export interface EmployeeReportRecord extends ReportRecord {
  id: string;
  cedula: string;
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  area: string;
  cargo: string;
  activo: number;
}

export interface MarkingFilters {
  fecha_desde?: string;
  fecha_hasta?: string;
  empleado_id?: string;
  area_id?: string;
}

export interface MarkingRecord extends ReportRecord {
  id: string;
  cedula: string;
  empleado: string;
  area: string;
  fecha: string;
  entrada1: string | null;
  salida1: string | null;
  entrada2: string | null;
  salida2: string | null;
  horas_trabajadas: string;
  horas_extra: string;
  minutos_tardanza: number;
  tipo_marcacion: string;
  estado: string;
}

export interface AreaReportFilters {
  area_id?: string;
  empleado_id?: string;
  usuario_id?: string;
  mes?: string;
  anio?: string;
  estado?: string;
}

export interface AreaReportRecord extends ReportRecord {
  id: string;
  empleado: string;
  cedula: string | null;
  area: string | null;
  dias_laborados: number;
  puntuales: number;
  tardanzas: number;
  ausencias: number;
  horas_trabajadas: number;
}

export interface HistoryRow extends ReportRecord {
  id: string;
  tipo_reporte: string;
  usuario_nombre: string;
  fecha_generacion: Date;
  formato: string | null;
  filtros: string | null;
  total_registros: number | null;
}

export interface SaveHistoryCommand {
  type: string;
  userName: string;
  format: string;
  filters: string;
  totalRecords: number | string;
}
