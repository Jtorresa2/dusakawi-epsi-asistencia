import type { Uuid } from '@shared/types/uuid';

export interface UpdateWorkDataCommandDto {
  id: Uuid;
  positionId?: Uuid;
  areaId?: Uuid;
  roles?: string[];
}
