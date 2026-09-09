import type { Role } from '@modules/users/domain/entities/role';
import type { Uuid } from '@shared/types/uuid';

export interface TokenHandler {
  createToken(id: Uuid, roles: Role[]): string;
}
