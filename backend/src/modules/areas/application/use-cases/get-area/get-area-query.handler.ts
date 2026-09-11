import { NotFoundError } from '@shared/errors/errors';
import type { AreaRepository } from '@modules/areas/domain/repositories/area-repository';
import type { GetAreaQueryDto } from './get-area-query.dto';
import type { GetAreaQueryResponseDto } from './get-area-query-response.dto';
import { AreaMapper } from '../../mappers/area.mapper';

export class GetAreaQueryHandler {
  constructor(private readonly areaRepository: AreaRepository) {}

  async handle(request: GetAreaQueryDto): Promise<GetAreaQueryResponseDto> {
    const area = await this.areaRepository.findById(request.id);
    if (!area) throw new NotFoundError('area');

    return {
      area: AreaMapper.toAreaResponseDto(area),
    };
  }
}
