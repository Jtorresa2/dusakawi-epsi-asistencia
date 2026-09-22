import type { Request, Response } from 'express';
import type { Uuid } from '@shared/types/uuid';
import type { GetFloorQueryHandler } from '@modules/areas/application/use-cases/get-floor/get-floor-query.handler';
import type { GetFloorsQueryHandler } from '@modules/areas/application/use-cases/get-floors/get-floors-query.handler';
import type { GetFloorsQueryDto } from '@modules/areas/application/use-cases/get-floors/get-floors-query.dto';
import type { CreateFloorCommandHandler } from '@modules/areas/application/use-cases/create-floor/create-floor-command.handler';
import type { DeleteFloorCommandHandler } from '@modules/areas/application/use-cases/delete-floor/delete-floor-command.handler';
import type { UpdateFloorCommandHandler } from '@modules/areas/application/use-cases/update-floor/update-floor-command.handler';

const getFloor = async (req: Request<{ id: Uuid }>, res: Response) => {
  const handler = req.container.resolve<GetFloorQueryHandler>(
    'getFloorQueryHandler',
  );
  const result = await handler.handle({ id: req.params.id });
  res.json(result);
};

const getFloors = async (req: Request<GetFloorsQueryDto>, res: Response) => {
  const handler = req.container.resolve<GetFloorsQueryHandler>(
    'getFloorsQueryHandler',
  );
  const result = await handler.handle({
    limit: Number(req.query.limit ?? 10),
    page: Number(req.query.page ?? 1),
    query: typeof req.query.query === 'string' ? req.query.query : undefined,
  });
  res.json(result);
};

const createFloor = async (req: Request, res: Response) => {
  const handler = req.container.resolve<CreateFloorCommandHandler>(
    'createFloorCommandHandler',
  );
  const result = await handler.handle(req.body);
  return res.status(201).json(result);
};

const deleteFloor = async (req: Request<{ id: Uuid }>, res: Response) => {
  const handler = req.container.resolve<DeleteFloorCommandHandler>(
    'deleteFloorCommandHandler',
  );
  await handler.handle({ id: req.params.id });
  return res.sendStatus(204);
};

const updateFloor = async (req: Request<{ id: Uuid }>, res: Response) => {
  const handler = req.container.resolve<UpdateFloorCommandHandler>(
    'updateFloorCommandHandler',
  );
  await handler.handle({ id: req.params.id, ...req.body });
  return res.sendStatus(204);
};

export default { getFloor, getFloors, createFloor, deleteFloor, updateFloor };
