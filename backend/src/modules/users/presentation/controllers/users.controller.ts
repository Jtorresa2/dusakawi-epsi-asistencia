import type { Request, Response } from 'express';
import type { Uuid } from '@shared/types/uuid.js';
import type { GetUserQueryHandler } from '../../application/use-cases/get-user/get-user-query.handler.js';
import type { DeleteUserCommandHandler } from '../../application/use-cases/delete-user/delete-user-command.handler.js';

const getUser = async (req: Request<{ id: Uuid }>, res: Response) => {
  const handler = req.container.resolve<GetUserQueryHandler>(
    'getUserQueryHandler',
  );

  const { id } = req.params;
  const result = await handler.handle({ id });

  res.json(result);
};

const deleteUser = async (req: Request<{ id: Uuid }>, res: Response) => {
  const handler = req.container.resolve<DeleteUserCommandHandler>(
    'deleteUserCommandHandler',
  );

  const { id } = req.params;
  await handler.handle({ id });

  res.sendStatus(204);
};

export default { getUser, deleteUser };
