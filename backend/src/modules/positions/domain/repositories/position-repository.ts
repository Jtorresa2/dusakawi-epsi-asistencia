import type { GenericRepository } from '@shared/repositories/generic-repository';
import { Position } from '../entities/position';
import { DataString } from '@shared/value-objects/data-string';

export interface PositionRepository extends GenericRepository<Position> {
  getPositionByName(name: DataString): Promise<Position | null>;
  getPositionByDescription(description: DataString): Promise<Position | null>;
}
