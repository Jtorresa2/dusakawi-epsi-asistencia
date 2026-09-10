import type { FloorDetailsDto } from './floor-details.dto';

export interface AreaDetailsDto {
  id: string;
  name: string;
  description?: string;
  floor: FloorDetailsDto;
}
