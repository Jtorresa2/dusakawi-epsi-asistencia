import type { Request, Response } from 'express';
import type { LoginQueryHandler } from '../../application/use-cases/login/login-query.handler.js';
import type { RegisterCommandHandler } from '../../application/use-cases/register/register-command.handler.js';

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
  return res.json(result);
};

export default { login, register };
