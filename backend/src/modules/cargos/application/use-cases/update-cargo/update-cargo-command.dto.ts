import type { Uuid } from '@shared/types/uuid';

export interface UpdateCargoCommandDto {
  id: Uuid;
  nombre?: string;
  name?: string;
  descripcion?: string;
  description?: string;
  area_id?: string | null;
  areaId?: string | null;
  estado?: string;
  active?: boolean;
}