import { NotFoundError } from '@shared/errors/errors';
import type { FloorRepository } from '@modules/areas/domain/repositories/floor-repository';
import type { GetFloorQueryDto } from './get-floor-query.dto';
import type { GetFloorQueryResponseDto } from './get-floor-query-response.dto';
import { FloorMapper } from '../../mappers/floor.mapper';

export class GetFloorQueryHandler {
  constructor(private readonly floorRepository: FloorRepository) {}

  async handle(request: GetFloorQueryDto): Promise<GetFloorQueryResponseDto> {
    const floor = await this.floorRepository.findById(request.id);
    if (!floor) throw new NotFoundError('floor');

    return { floor: FloorMapper.toFloorResponseDto(floor) };
  }
}
