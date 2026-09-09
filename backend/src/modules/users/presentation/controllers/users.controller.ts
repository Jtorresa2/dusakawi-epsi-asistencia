import type { Request, Response } from 'express';
import type { Uuid } from '@shared/types/uuid.js';
import type { GetUserQueryHandler } from '../../application/use-cases/get-user/get-user-query.handler.js';
import type { DeleteUserCommandHandler } from '../../application/use-cases/delete-user/delete-user-command.handler.js';
import type { GetUsersQueryHandler } from '../../application/use-cases/get-users/get-users-query.handler.js';
import type { GetUsersQueryDto } from '../../application/use-cases/get-users/get-users-query.dto.js';
import type { UpdateUserBasicDataCommandHandler } from '../../application/use-cases/update-user-basic-data/update-user-basic-data-command.handler.js';
import type { UpdateWorkDataCommandHandler } from '../../application/use-cases/update-work-data/update-work-data-command.handler.js';

const getUser = async (req: Request<{ id: Uuid }>, res: Response) => {
  const handler = req.container.resolve<GetUserQueryHandler>(
    'getUserQueryHandler',
  );

  const { id } = req.params;
  const result = await handler.handle({ id });

  res.json(result);
};

const getUsers = async (req: Request<GetUsersQueryDto>, res: Response) => {
  const handler = req.container.resolve<GetUsersQueryHandler>(
    'getUsersQueryHandler',
  );

  const result = await handler.handle({
    limit: Number(req.query.limit),
    page: Number(req.query.page),
    query: typeof req.query.query === 'string' ? req.query.query : undefined,
  });

  res.json(result);
};

const updateUserBasicData = async (
  req: Request<{ id: Uuid }>,
  res: Response,
) => {
  const handler = req.container.resolve<UpdateUserBasicDataCommandHandler>(
    'updateUserBasicDataCommandHandler',
  );

  const { id } = req.params;

  await handler.handle({ id, ...req.body });

  res.sendStatus(204);
};

const updateUserWorkData = async (
  req: Request<{ id: Uuid }>,
  res: Response,
) => {
  const handler = req.container.resolve<UpdateWorkDataCommandHandler>(
    'updateWorkDataCommandHandler',
  );

  const { id } = req.params;

  await handler.handle({ id, ...req.body });

  res.sendStatus(204);
};

const deleteUser = async (req: Request<{ id: Uuid }>, res: Response) => {
  const handler = req.container.resolve<DeleteUserCommandHandler>(
    'deleteUserCommandHandler',
  );

  const { id } = req.params;
  await handler.handle({ id });

  res.sendStatus(204);
};

export default {
  getUser,
  getUsers,
  updateUserBasicData,
  updateUserWorkData,
  deleteUser,
};
