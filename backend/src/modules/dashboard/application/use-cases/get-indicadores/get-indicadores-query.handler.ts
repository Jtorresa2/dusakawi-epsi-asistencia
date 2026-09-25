import type { DashboardIndicadoresRepository } from '@modules/dashboard/domain/repositories/dashboard-indicadores-repository';
import type { GetIndicadoresQueryDto } from './get-indicadores-query.dto';
import type { GetIndicadoresResponseDto } from '@modules/dashboard/application/common/dtos/dashboard-indicadores-response.dto';

export class GetIndicadoresQueryHandler {
  constructor(
    private readonly dashboardIndicadoresRepository: DashboardIndicadoresRepository,
  ) {}

  async handle(request: GetIndicadoresQueryDto): Promise<GetIndicadoresResponseDto> {
    return this.dashboardIndicadoresRepository.getIndicadores(request);
  }
}