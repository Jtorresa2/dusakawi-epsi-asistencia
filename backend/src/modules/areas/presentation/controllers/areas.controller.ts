import type { Request, Response } from 'express';
import type { Uuid } from '@shared/types/uuid';
import type { GetAreaQueryHandler } from '@modules/areas/application/use-cases/get-area/get-area-query.handler';

const getArea = async (req: Request<{ id: Uuid }>, res: Response) => {
  const handler = req.container.resolve<GetAreaQueryHandler>(
    'getAreaQueryHandler',
  );

  const { id } = req.params;
  const result = await handler.handle({ id });

  res.json(result);
};

export default { getArea };
