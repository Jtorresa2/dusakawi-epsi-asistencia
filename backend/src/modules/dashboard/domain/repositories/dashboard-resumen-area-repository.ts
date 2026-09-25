import type { DashboardResumenAreaEntity } from '../entities/dashboard-resumen-area';

export interface DashboardResumenAreaRepository {
  getResumenPorArea(): Promise<DashboardResumenAreaEntity[]>;
}