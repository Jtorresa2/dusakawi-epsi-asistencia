import type { LoginQueryHandler } from '@modules/auth/application/use-cases/login/login-query.handler';
import type { RegisterCommandHandler } from '@modules/auth/application/use-cases/register/register-command.handler';
import type { GetProfileHandler } from '@modules/auth/application/use-cases/profile/get-profile.handler';
import type { GetPermissionsHandler } from '@modules/auth/application/use-cases/permissions/get-permissions.handler';
import type { ChangePasswordHandler } from '@modules/auth/application/use-cases/password/change-password.handler';
import type { RequestPasswordResetHandler } from '@modules/auth/application/use-cases/password/request-password-reset.handler';
import type { ValidateResetTokenHandler } from '@modules/auth/application/use-cases/password/validate-reset-token.handler';
import type { ResetPasswordHandler } from '@modules/auth/application/use-cases/password/reset-password.handler';
import type { Request, Response } from 'express';

const login = async (req: Request, res: Response) => {
  const handler = req.container.resolve<LoginQueryHandler>('loginQueryHandler');
  const result = await handler.handle(req.body);

  return res.status(result.status).json(result.body);
};

const register = async (req: Request, res: Response) => {
  const handler = req.container.resolve<RegisterCommandHandler>(
    'registerCommandHandler',
  );

  const result = await handler.handle(req.body);
  return res.status(201).json(result);
};

const perfil = async (req: Request, res: Response) => {
  const handler = req.container.resolve<GetProfileHandler>('getProfileHandler');
  const result = await handler.handle(req.user!.id!);

  return res.status(result.status).json(result.body);
};

const cambiarPassword = async (req: Request, res: Response) => {
  const handler = req.container.resolve<ChangePasswordHandler>(
    'changePasswordHandler',
  );
  const result = await handler.handle(req.body, req.user!.id!);

  return res.status(result.status).json(result.body);
};

const misPermisos = async (req: Request, res: Response) => {
  const handler = req.container.resolve<GetPermissionsHandler>(
    'getPermissionsHandler',
  );
  const result = await handler.handle(req.user!.id!);

  return res.status(result.status).json(result.body);
};

const solicitarResetPassword = async (req: Request, res: Response) => {
  const handler = req.container.resolve<RequestPasswordResetHandler>(
    'requestPasswordResetHandler',
  );
  const result = await handler.handle(req.body);

  return res.status(result.status).json(result.body);
};

const validarTokenReset = async (req: Request, res: Response) => {
  const handler = req.container.resolve<ValidateResetTokenHandler>(
    'validateResetTokenHandler',
  );
  const result = await handler.handle(req.query.token as string | undefined);

  return res.status(result.status).json(result.body);
};

const restablecerPassword = async (req: Request, res: Response) => {
  const handler = req.container.resolve<ResetPasswordHandler>(
    'resetPasswordHandler',
  );
  const result = await handler.handle(req.body);

  return res.status(result.status).json(result.body);
};

export default {
  login,
  register,
  perfil,
  cambiarPassword,
  misPermisos,
  solicitarResetPassword,
  validarTokenReset,
  restablecerPassword,
};
