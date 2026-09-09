import type { GenericRepository } from '@shared/repositories/generic-repository';
import { Role } from '../entities/role';
import { DataString } from '@shared/value-objects/data-string';

export interface RoleRepository extends GenericRepository<Role> {
  getRoleByName(name: DataString): Promise<Role | null>;
  getRoleByDescription(description: DataString): Promise<Role | null>;
  getRolesByName(roles: string[]): Promise<Role[]>;
}
