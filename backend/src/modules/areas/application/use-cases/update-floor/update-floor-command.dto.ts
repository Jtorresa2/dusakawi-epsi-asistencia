import type { Uuid } from '@shared/types/uuid';

export interface UpdateFloorCommandDto {
  id: Uuid;
  name?: string;
}
