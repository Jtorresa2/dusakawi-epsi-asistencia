import type { Request, Response } from 'express';
import type { Uuid } from '@shared/types/uuid';
import type { GetAreaQueryHandler } from '@modules/areas/application/use-cases/get-area/get-area-query.handler';
import type { GetAreasQueryHandler } from '@modules/areas/application/use-cases/get-areas/get-areas-query.handler';
import type { GetAreasQueryDto } from '@modules/areas/application/use-cases/get-areas/get-areas-query.dto';

const getArea = async (req: Request<{ id: Uuid }>, res: Response) => {
  const handler = req.container.resolve<GetAreaQueryHandler>(
    'getAreaQueryHandler',
  );

  const { id } = req.params;
  const result = await handler.handle({ id });

  res.json(result);
};

const getAreas = async (req: Request<GetAreasQueryDto>, res: Response) => {
  const handler = req.container.resolve<GetAreasQueryHandler>(
    'getAreasQueryHandler',
  );

  const result = await handler.handle({
    limit: Number(req.query.limit ?? 10),
    page: Number(req.query.page ?? 1),
    query: typeof req.query.query === 'string' ? req.query.query : undefined,
  });

  res.json(result);
};

export default { getArea, getAreas };
