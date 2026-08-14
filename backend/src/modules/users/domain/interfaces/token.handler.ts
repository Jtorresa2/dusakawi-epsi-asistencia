import { Uuid } from '@shared/types/uuid.js';
import { Role } from '../entities/role.js';

export interface TokenHandler {
  createToken(id: Uuid, roles: Role[]): string;
}
