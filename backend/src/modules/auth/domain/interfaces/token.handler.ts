import type { Uuid } from '@shared/types/uuid';
import { Role } from '@modules/users/domain/entities/role';

export interface TokenHandler {
  createToken(id: Uuid, roles: Role[]): string;
}
