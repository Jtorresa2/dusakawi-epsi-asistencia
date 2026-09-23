import type { Request, Response } from 'express';
import type { Uuid } from '@shared/types/uuid';
import { CargoInUseError } from '@modules/cargos/domain/errors/cargo-in-use.error';
import type { GetCargosQueryHandler } from '@modules/cargos/application/use-cases/get-cargos/get-cargos-query.handler';
import type { GetCargoQueryHandler } from '@modules/cargos/application/use-cases/get-cargo/get-cargo-query.handler';
import type { CreateCargoCommandHandler } from '@modules/cargos/application/use-cases/create-cargo/create-cargo-command.handler';
import type { UpdateCargoCommandHandler } from '@modules/cargos/application/use-cases/update-cargo/update-cargo-command.handler';
import type { DeleteCargoCommandHandler } from '@modules/cargos/application/use-cases/delete-cargo/delete-cargo-command.handler';

const getAll = async (_req: Request, res: Response) => {
  try {
    const handler = _req.container.resolve<GetCargosQueryHandler>(
      'getCargosQueryHandler',
    );

    const resultado = await handler.handle();
    res.json(resultado);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: 'Error al obtener los cargos',
    });
  }
};

const getById = async (req: Request<{ id: Uuid }>, res: Response) => {
  try {
    const handler = req.container.resolve<GetCargoQueryHandler>(
      'getCargoQueryHandler',
    );

    const resultado = await handler.handle({ id: req.params.id });

    if (!resultado) {
      return res.status(404).json({
        mensaje: 'Cargo no encontrado',
      });
    }

    res.json(resultado);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: 'Error al obtener el cargo',
    });
  }
};

const create = async (req: Request, res: Response) => {
  try {
    const handler = req.container.resolve<CreateCargoCommandHandler>(
      'createCargoCommandHandler',
    );

    const resultado = await handler.handle(req.body);
    res.status(201).json(resultado);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: 'Error al crear el cargo',
    });
  }
};

const update = async (req: Request<{ id: Uuid }>, res: Response) => {
  try {
    const handler = req.container.resolve<UpdateCargoCommandHandler>(
      'updateCargoCommandHandler',
    );

    const resultado = await handler.handle({ id: req.params.id, ...req.body });
    res.json(resultado);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: 'Error al actualizar el cargo',
    });
  }
};

const deleteCargo = async (req: Request<{ id: Uuid }>, res: Response) => {
  try {
    const handler = req.container.resolve<DeleteCargoCommandHandler>(
      'deleteCargoCommandHandler',
    );

    const resultado = await handler.handle({ id: req.params.id });
    res.json(resultado);
  } catch (error) {
    console.error(error);

    if (error instanceof CargoInUseError) {
      return res.status(400).json({
        mensaje:
          'No se puede eliminar el cargo porque está asignado a uno o más empleados.',
      });
    }

    res.status(500).json({
      mensaje: 'Error al eliminar el cargo',
    });
  }
};

export default { getAll, getById, create, update, delete: deleteCargo };