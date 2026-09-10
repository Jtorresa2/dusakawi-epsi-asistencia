import type { Area } from '@modules/areas/domain/entities/area';
import type { AreaDetailsDto } from '../common/dtos/area-details.dto';

export class AreaMapper {
  static toAreaResponseDto(area: Area): AreaDetailsDto {
    return {
      id: area.metadata.id,
      name: area.name.value,
      description: area.description?.value,
      floor: {
        id: area.floor.metadata.id,
        name: area.floor.name.value,
      },
    };
  }
}
