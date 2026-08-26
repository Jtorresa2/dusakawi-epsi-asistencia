import type { Request, Response } from 'express';
import type { GetUserQueryHandler } from '../../application/use-cases/get-user/get-user-query.handler.js';
import type { Uuid } from '@shared/types/uuid.js';

const getUser = async (req: Request<{ id: Uuid }>, res: Response) => {
  const handler = req.container.resolve<GetUserQueryHandler>(
    'getUserQueryHandler',
  );

  const { id } = req.params;
  const result = await handler.handle({ id });

  res.json(result);
};

export default { getUser };
