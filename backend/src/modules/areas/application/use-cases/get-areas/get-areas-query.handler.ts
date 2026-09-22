import { PagedListDto } from '@shared/dtos/paged-list.dto';
import type { AreaRepository } from '@modules/areas/domain/repositories/area-repository';
import type { GetAreasQueryDto } from './get-areas-query.dto';
import type { AreaDetailsDto } from '../../common/dtos/area-details.dto';
import { AreaMapper } from '../../mappers/area.mapper';

export class GetAreasQueryHandler {
  constructor(private readonly areaRepository: AreaRepository) {}

  async handle(
    request: GetAreasQueryDto,
  ): Promise<PagedListDto<AreaDetailsDto>> {
    const { page = 1, limit = 10, query } = request;

    const { total, items } = await this.areaRepository.findAll({
      page,
      limit,
      query,
    });

    return PagedListDto.create<AreaDetailsDto>(
      total,
      page,
      limit,
      items.map((area) => AreaMapper.toAreaResponseDto(area)),
    );
  }
}
