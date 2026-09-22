import jwt from 'jsonwebtoken';
import { Environment } from '@config/environment';
import type { Uuid } from '@shared/types/uuid';
import { Role } from '@modules/users/domain/entities/role';
import type { TokenHandler } from '@modules/auth/domain/interfaces/token.handler';

export class JwtHandler implements TokenHandler {
  createToken(id: Uuid, roles: Role[]): string {
    const roleNames = roles.map((role) => role.name?.value || 'Empleado');
    const roleIds = roles.map((role) => role.metadata?.id ?? '');
    const primaryRole = roleNames[0] || 'Empleado';

    return jwt.sign(
      {
        id,
        roles: roleNames,
        roleIds,
        rol: primaryRole,
      },
      Environment.JWT_SECRET,
      { expiresIn: '2h' },
    );
  }
}
