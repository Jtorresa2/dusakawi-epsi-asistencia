import type { Uuid } from '@shared/types/uuid.js';
import { Environment } from '@config/environment.js';
import jwt from 'jsonwebtoken';
import type { Role } from '../../../domain/entities/role.js';
import type { TokenHandler } from '../../../domain/interfaces/token.handler.js';

export class JwtHandler implements TokenHandler {
  createToken(id: Uuid, roles: Role[]): string {
    return jwt.sign(
      {
        id,
        roles: roles.map((role) => role.metadata!.id),
      },
      Environment.JWT_SECRET,
      { expiresIn: '2h' },
    );
  }
}
