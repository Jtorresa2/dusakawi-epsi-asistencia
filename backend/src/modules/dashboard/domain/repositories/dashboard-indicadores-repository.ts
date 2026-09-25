import type { DashboardIndicadoresFullEntity } from '../entities/dashboard-indicadores';
import type { GetIndicadoresQueryDto } from '../../application/use-cases/get-indicadores/get-indicadores-query.dto';

export interface DashboardIndicadoresRepository {
  getIndicadores(request: GetIndicadoresQueryDto): Promise<DashboardIndicadoresFullEntity>;
}