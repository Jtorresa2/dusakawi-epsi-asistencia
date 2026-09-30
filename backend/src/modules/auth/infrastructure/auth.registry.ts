import { type AwilixContainer, asClass } from 'awilix';
import { JwtHandler } from './security/jwt/jwt.handler';
import { BcryptjsPasswordHasher } from './security/bcryptjs-password-hasher';
import { RegisterCommandHandler } from '../application/use-cases/register/register-command.handler';
import { LoginQueryHandler } from '../application/use-cases/login/login-query.handler';
import { GetProfileHandler } from '../application/use-cases/profile/get-profile.handler';
import { GetPermissionsHandler } from '../application/use-cases/permissions/get-permissions.handler';
import { ChangePasswordHandler } from '../application/use-cases/password/change-password.handler';
import { RequestPasswordResetHandler } from '../application/use-cases/password/request-password-reset.handler';
import { ValidateResetTokenHandler } from '../application/use-cases/password/validate-reset-token.handler';
import { ResetPasswordHandler } from '../application/use-cases/password/reset-password.handler';

export function registerAuthModule(container: AwilixContainer) {
  container.register({
    // services
    tokenHandler: asClass(JwtHandler).singleton(),
    passwordHasher: asClass(BcryptjsPasswordHasher).singleton(),

    // use-cases
    registerCommandHandler: asClass(RegisterCommandHandler).scoped(),
    loginQueryHandler: asClass(LoginQueryHandler).scoped(),
    getProfileHandler: asClass(GetProfileHandler).scoped(),
    getPermissionsHandler: asClass(GetPermissionsHandler).scoped(),
    changePasswordHandler: asClass(ChangePasswordHandler).scoped(),
    requestPasswordResetHandler: asClass(RequestPasswordResetHandler).scoped(),
    validateResetTokenHandler: asClass(ValidateResetTokenHandler).scoped(),
    resetPasswordHandler: asClass(ResetPasswordHandler).scoped(),
  });
}
