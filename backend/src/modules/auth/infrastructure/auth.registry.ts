import { type AwilixContainer, asClass } from 'awilix';
import { JwtHandler } from './security/jwt/jwt.handler';
import { BcryptjsPasswordHasher } from './security/bcryptjs-password-hasher';
import { RegisterCommandHandler } from '../application/use-cases/register/register-command.handler';
import { LoginQueryHandler } from '../application/use-cases/login/login-query.handler';

export function registerAuthModule(container: AwilixContainer) {
  container.register({
    // services
    tokenHandler: asClass(JwtHandler).singleton(),
    passwordHasher: asClass(BcryptjsPasswordHasher).singleton(),

    // use-cases
    registerCommandHandler: asClass(RegisterCommandHandler).scoped(),
    loginQueryHandler: asClass(LoginQueryHandler).scoped(),
  });
}
