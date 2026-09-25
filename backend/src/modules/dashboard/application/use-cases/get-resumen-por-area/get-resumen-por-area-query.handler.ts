import type { DashboardResumenAreaRepository } from '@modules/dashboard/domain/repositories/dashboard-resumen-area-repository';
import type { GetResumenPorAreaResponseDto } from '@modules/dashboard/application/common/dtos/dashboard-resumen-area-response.dto';

export class GetResumenPorAreaQueryHandler {
  constructor(
    private readonly dashboardResumenAreaRepository: DashboardResumenAreaRepository,
  ) {}

  async handle(): Promise<GetResumenPorAreaResponseDto[]> {
    return this.dashboardResumenAreaRepository.getResumenPorArea();
  }
}