import type { AreaRepository } from '@modules/areas/domain/repositories/area-repository';
import type { GetAreaQueryDto } from './get-area-query.dto';
import type { GetAreaQueryResponseDto } from './get-area-query-response.dto';

export class GetAreaQueryHandler {
  constructor(private readonly areaRepository: AreaRepository) {}

  async handle(request: GetAreaQueryDto): Promise<GetAreaQueryResponseDto> {
    const area = await this.areaRepository.findById(request.id);
    if (!area) throw new Error('area');

    return {
      area: {
        id: area.metadata.id,
        name: area.name.value,
        description: area.description?.value,
        floor: {
          id: area.floor.metadata.id,
          name: area.floor.name.value,
        },
      },
    };
  }
}
