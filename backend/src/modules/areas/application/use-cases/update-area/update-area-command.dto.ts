import type { Uuid } from '@shared/types/uuid';

export interface UpdateAreaCommandDto {
  id: Uuid;
  name?: string;
  description?: string;
  floorId?: Uuid;
}
