export interface DashboardResumenAreaEntity {
  id: string;
  area: string;
  presentes: number;
  ausentes: number;
  tardanzas: number;
  total: number;
  porcentaje_asistencia: number;
}