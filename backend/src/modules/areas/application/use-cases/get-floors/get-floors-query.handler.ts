import { PagedListDto } from '@shared/dtos/paged-list.dto';
import type { FloorRepository } from '@modules/areas/domain/repositories/floor-repository';
import type { GetFloorsQueryDto } from './get-floors-query.dto';
import type { FloorDetailsDto } from '../../common/dtos/floor-details.dto';
import { FloorMapper } from '../../mappers/floor.mapper';

export class GetFloorsQueryHandler {
  constructor(private readonly floorRepository: FloorRepository) {}

  async handle(
    request: GetFloorsQueryDto,
  ): Promise<PagedListDto<FloorDetailsDto>> {
    const { page = 1, limit = 10, query } = request;
    const { total, items } = await this.floorRepository.findAll({
      page,
      limit,
      query,
    });

    return PagedListDto.create<FloorDetailsDto>(
      total,
      page,
      limit,
      items.map((floor) => FloorMapper.toFloorResponseDto(floor)),
    );
  }
}
