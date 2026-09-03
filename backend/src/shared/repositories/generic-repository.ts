import { GenericEntity } from '@shared/entities/generic-entity.js';
import type { PagedListResponse } from '@shared/types/paged-list-response.js';
import type { Uuid } from '@shared/types/uuid.js';

export interface FindAllOptions {
  page?: number;
  limit?: number;
  query?: string;
}

export interface GenericRepository<T extends GenericEntity> {
  create(entity: T): Promise<void>;
  update(id: Uuid, entity: T): Promise<void>;
  delete(id: Uuid): Promise<void>;
  findById(id: Uuid): Promise<T | null>;
  findAll(options?: FindAllOptions): Promise<PagedListResponse<T>>;
}
