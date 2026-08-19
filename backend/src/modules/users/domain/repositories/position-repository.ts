import type { GenericRepository } from '@shared/repositories/generic-repository.js';
import { Position } from '../entities/position.js';
import { DataString } from '@shared/value-objects/data-string.js';

export interface PositionRepository extends GenericRepository<Position> {
  getPositionByName(name: DataString): Promise<Position>;
  getPositionByDescription(description: DataString): Promise<Position>;
}
