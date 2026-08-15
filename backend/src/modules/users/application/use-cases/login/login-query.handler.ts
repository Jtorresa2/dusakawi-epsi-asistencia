import { PasswordHasher } from '../../../domain/interfaces/password-hasher.js';
import { TokenHandler } from '../../../domain/interfaces/token.handler.js';
import { UserRepository } from '../../../domain/repositories/user-repository.js';
import { AuthResposeDto } from '../../common/auth-response.dto.js';
import { LoginQueryDto } from './login-query.dto.js';

export class LoginQueryHandler {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenHandler: TokenHandler,
  ) {}

  async handle(request: LoginQueryDto): Promise<AuthResposeDto> {
    const user = await this.userRepository.getUserByUsername(request.username);

    if (!user) throw new Error('Invalid username or password');

    const isPasswordValid = this.passwordHasher.verify(
      request.password,
      user.password,
    );

    if (!isPasswordValid) throw new Error('Invalid username or password');

    const token = this.tokenHandler.createToken(user.id, user.roles);

    return {
      token,
    };
  }
}
