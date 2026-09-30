import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { UserRepository } from '@modules/users/domain/repositories/user-repository';
import type { LegacyResult } from '../../common/legacy-result';
import type { LoginQueryDto } from './login-query.dto';

const ALLOWED_ROLES = ['Administrador', 'Talento Humano'];

const rolesMap: Record<string, string> = {
  Administrador: 'admin',
  'Talento Humano': 'talento_humano',
};

export class LoginQueryHandler {
  constructor(private readonly userRepository: UserRepository) {}

  async handle(request: LoginQueryDto): Promise<LegacyResult> {
    try {
      const { username, password } = request;

      if (!username || !password) {
        return { status: 400, body: { mensaje: 'Faltan datos' } };
      }

      const user = await this.userRepository.getUserByUsername(username);

      if (!user) {
        return { status: 401, body: { mensaje: 'Usuario no existe' } };
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash.value);

      if (!isPasswordValid) {
        return { status: 401, body: { mensaje: 'Contrasena incorrecta' } };
      }

      const userRoles = user.roles
        .map((role) => role.name?.value)
        .filter(Boolean) as string[];
      const authorizedRole = userRoles.find((role) => ALLOWED_ROLES.includes(role));

      if (!authorizedRole) {
        return {
          status: 403,
          body: {
            mensaje:
              'Acceso denegado: su rol no tiene autorización para acceder al sistema',
          },
        };
      }

      let fullName = `${user.firstName.value} ${user.firstSurname.value ?? ''}`.trim();
      if (fullName.toLowerCase().startsWith('administrador') || user.username.value.toLowerCase() === 'administrador') {
        fullName = 'Administrador';
      }

      // Verificar si el usuario debe cambiar su contraseña antes de permitir el acceso
      const passwordResetRequired = await this.userRepository.getPasswordResetRequired(
        user.metadata!.id,
      );

      if (passwordResetRequired) {
        return {
          status: 403,
          body: {
            mensaje: 'Debes cambiar tu contraseña antes de acceder al sistema.',
            password_reset_required: true,
          },
        };
      }

      const token = jwt.sign(
        {
          id: user.metadata!.id,
          empleado_id: user.metadata!.id,
          username: user.username.value,
          nombre: fullName,
          rol: rolesMap[authorizedRole] || authorizedRole,
          roles: userRoles.filter((role) => ALLOWED_ROLES.includes(role)),
        },
        process.env.JWT_SECRET || 'dusakawi_jwt_secret_2024',
        { expiresIn: '8h' },
      );

      return {
        status: 200,
        body: {
          token,
          password_reset_required: false,
          user: {
            id: user.metadata!.id,
            empleado_id: user.metadata!.id,
            username: user.username.value,
            nombre: fullName,
            email: user.email.value,
            rol: authorizedRole,
            area_id: user.area?.metadata?.id ?? null,
            cargo_id: user.position?.metadata?.id ?? null,
          },
        },
      };
    } catch (error) {
      console.error('LOGIN ERROR:', error);
      const detail = error instanceof Error ? error.message : String(error);
      return {
        status: 500,
        body: { mensaje: 'Error en login', detalle: detail },
      };
    }
  }
}
