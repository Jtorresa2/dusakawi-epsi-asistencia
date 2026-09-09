import jwt from 'jsonwebtoken';
import type { Uuid } from '@shared/types/uuid';
import { Environment } from '@config/environment';
import type { Role } from '@modules/users/domain/entities/role';
import type { TokenHandler } from '@modules/auth/domain/interfaces/token.handler';

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
