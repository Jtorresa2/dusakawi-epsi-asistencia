import type { Uuid } from '@shared/types/uuid';
import type { GenericRepository } from '@shared/repositories/generic-repository';
import { Area } from '../entities/area';

export interface AreaRepository extends GenericRepository<Area> {
  areaExists(name: string): Promise<boolean>;
}
