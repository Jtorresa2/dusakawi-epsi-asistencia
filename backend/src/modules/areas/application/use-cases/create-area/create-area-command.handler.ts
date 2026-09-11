import { ConflictError } from '@shared/errors/errors';
import type { GenericResponseDto } from '@shared/dtos/generic-response.dto';
import type { AreaRepository } from '@modules/areas/domain/repositories/area-repository';
import type { CreateAreaDto } from './create-area-command.dto';
import type { FloorRepository } from '@modules/areas/domain/repositories/floor-repository';
import { DataString } from '@shared/value-objects/data-string';
import { Area } from '@modules/areas/domain/entities/area';

export class CreateAreaCommandHandler {
  constructor(
    private readonly areaRepository: AreaRepository,
    private readonly floorRepository: FloorRepository,
  ) {}

  async handle(request: CreateAreaDto): Promise<GenericResponseDto> {
    const floor = await this.floorRepository.findById(request.floorId);
    if (!floor) throw new Error('floor');

    const areaExists = await this.areaRepository.areaExists(request.name);
    if (areaExists) throw new ConflictError('area already exists');

    const newArea = new Area(
      floor,
      DataString.create(request.name),
      request.description ? DataString.create(request.description) : null,
    );

    await this.areaRepository.create(newArea);

    return { message: 'area created' };
  }
}
