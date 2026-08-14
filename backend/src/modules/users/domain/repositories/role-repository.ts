import { GenericRepository } from '@shared/repositories/generic-repository.js';
import { Role } from '../entities/role.js';
import { DataString } from '@shared/value-objects/data-string.js';

export interface RoleRepository extends GenericRepository<Role> {
  getRoleByName(name: DataString): Promise<Role>;
  getRoleByDescription(description: DataString): Promise<Role>;
}
