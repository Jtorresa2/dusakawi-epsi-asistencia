import type { Uuid } from '@shared/types/uuid';

export interface UpdateCargoCommandDto {
  id: Uuid;
  nombre?: string;
  name?: string;
  descripcion?: string;
  description?: string;
}