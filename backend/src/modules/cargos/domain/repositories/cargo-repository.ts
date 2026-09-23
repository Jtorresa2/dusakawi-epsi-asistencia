import type { Uuid } from '@shared/types/uuid';
import type { Cargo, CargoWithCount } from '../entities/cargo';

export interface CargoRepository {
  getAll(): Promise<CargoWithCount[]>;
  getById(id: Uuid): Promise<Cargo | null>;
  create(cargo: Cargo): Promise<Uuid>;
  update(id: Uuid, cargo: Cargo): Promise<void>;
  delete(id: Uuid): Promise<void>;
}