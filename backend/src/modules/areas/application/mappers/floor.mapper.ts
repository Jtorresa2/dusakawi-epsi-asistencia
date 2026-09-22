import type { Floor } from '@modules/areas/domain/entities/floor';
import type { FloorDetailsDto } from '../common/dtos/floor-details.dto';

export class FloorMapper {
  static toFloorResponseDto(floor: Floor): FloorDetailsDto {
    return {
      id: floor.metadata.id,
      name: floor.name.value,
    };
  }
}
