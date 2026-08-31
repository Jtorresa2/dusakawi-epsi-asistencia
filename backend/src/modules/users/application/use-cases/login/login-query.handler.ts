import { NotFoundError } from '@shared/errors/errors.js';
import type { PasswordHasher } from '../../../domain/interfaces/password-hasher.js';
import type { TokenHandler } from '../../../domain/interfaces/token.handler.js';
import type { UserRepository } from '../../../domain/repositories/user-repository.js';
import type { AuthResposeDto } from '../../common/dtos/auth-response.dto.js';
import type { LoginQueryDto } from './login-query.dto.js';

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
      user.password,
    );

    if (!isPasswordValid) {
      throw new NotFoundError('username or password');
    }

    const token = this.tokenHandler.createToken(user.metadata!.id, user.roles);

    return {
      token,
    };
  }
}
