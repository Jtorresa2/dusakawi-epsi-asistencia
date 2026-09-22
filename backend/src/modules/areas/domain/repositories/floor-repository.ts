import type { GenericRepository } from '@shared/repositories/generic-repository';
import type { Floor } from '../entities/floor';

export interface FloorRepository extends GenericRepository<Floor> {
  floorExists(name: string): Promise<boolean>;
}
