import type { LoginQueryHandler } from '@modules/auth/application/use-cases/login/login-query.handler';
import type { RegisterCommandHandler } from '@modules/auth/application/use-cases/register/register-command.handler';
import type { Request, Response } from 'express';

const login = async (req: Request, res: Response) => {
  const handler = req.container.resolve<LoginQueryHandler>('loginQueryHandler');
  const result = await handler.handle(req.body);

  return res.json(result);
};

const register = async (req: Request, res: Response) => {
  const handler = req.container.resolve<RegisterCommandHandler>(
    'registerCommandHandler',
  );

  const result = await handler.handle(req.body);
  return res.status(201).json(result);
};

export default { login, register };
