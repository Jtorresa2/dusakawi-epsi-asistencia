import { NotFoundError } from '@shared/errors/errors';
import type { UserRepository } from '@modules/users/domain/repositories/user-repository';
import type { PasswordHasher } from '@modules/auth/domain/interfaces/password-hasher';
import type { TokenHandler } from '@modules/auth/domain/interfaces/token.handler';
import type { AuthResposeDto } from '../../common/dtos/auth-response.dto';
import type { LoginQueryDto } from './login-query.dto';

export class LoginQueryHandler {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenHandler: TokenHandler,
  ) {}

  async handle(request: LoginQueryDto): Promise<AuthResposeDto> {
    const user = await this.userRepository.getUserByUsername(request.username);

    if (!user) throw new NotFoundError('username or password');

    const isPasswordValid = await this.passwordHasher.verify(
      request.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new NotFoundError('username or password');
    }

    const token = this.tokenHandler.createToken(user.metadata!.id, user.roles);
    const primaryRole = user.roles[0]?.name?.value || 'Empleado';
    const fullName = `${user.firstName.value} ${user.firstSurname.value}`.trim();

    return {
      token,
      user: {
        id: user.metadata!.id,
        username: user.username.value,
        nombre: fullName,
        email: user.email.value,
        rol: primaryRole,
        area_id: user.area?.metadata?.id,
        cargo_id: user.position?.metadata?.id,
      },
      password_reset_required: false,
    };
  }
}
