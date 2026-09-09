import type { Uuid } from '@shared/types/uuid.js';
import type { WorkData } from '../../../domain/entities/user.js';

export interface UpdateWorkDataCommandDto {
  id: Uuid;
  positionId?: Uuid;
  areaId?: Uuid;
  roles?: string[];
}
