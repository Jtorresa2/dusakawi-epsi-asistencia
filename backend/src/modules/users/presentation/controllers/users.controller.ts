import type { Request, Response } from 'express';
import type { Uuid } from '@shared/types/uuid';
import type { DeleteUserCommandHandler } from '@modules/users/application/use-cases/delete-user/delete-user-command.handler';
import type { GetUserQueryHandler } from '@modules/users/application/use-cases/get-user/get-user-query.handler';
import type { GetUsersQueryDto } from '@modules/users/application/use-cases/get-users/get-users-query.dto';
import type { GetUsersQueryHandler } from '@modules/users/application/use-cases/get-users/get-users-query.handler';
import type { UpdateBasicDataCommandHandler } from '@modules/users/application/use-cases/update-basic-data/update-basic-data-command.handler';
import type { UpdateWorkDataCommandHandler } from '@modules/users/application/use-cases/update-work-data/update-work-data-command.handler';

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

const updateBasicData = async (req: Request<{ id: Uuid }>, res: Response) => {
  const handler = req.container.resolve<UpdateBasicDataCommandHandler>(
    'updateBasicDataCommandHandler',
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
  updateBasicData,
  updateUserWorkData,
  deleteUser,
};
