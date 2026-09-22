import type { Uuid } from '@shared/types/uuid';

export interface CreateAreaDto {
  floorId: Uuid;
  name: string;
  description?: string;
}
