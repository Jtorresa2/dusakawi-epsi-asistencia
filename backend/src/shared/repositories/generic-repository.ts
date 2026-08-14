import { GenericEntity } from '@shared/entities/generic-entity.js';
import { Uuid } from '@shared/types/uuid.js';

export interface GenericRepository<T extends GenericEntity> {
  create(entity: T): Promise<void>;
  update(entity: T): Promise<void>;
  delete(id: Uuid): Promise<void>;
  findById(id: Uuid): Promise<T | null>;
  findAll(): Promise<T[]>;
}
