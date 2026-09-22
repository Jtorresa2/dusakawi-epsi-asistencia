import { ConflictError } from '@shared/errors/errors';
import type { GenericResponseDto } from '@shared/dtos/generic-response.dto';
import type { FloorRepository } from '@modules/areas/domain/repositories/floor-repository';
import type { CreateFloorCommandDto } from './create-floor-command.dto';
import { DataString } from '@shared/value-objects/data-string';
import { Floor } from '@modules/areas/domain/entities/floor';

export class CreateFloorCommandHandler {
  constructor(private readonly floorRepository: FloorRepository) {}

  async handle(request: CreateFloorCommandDto): Promise<GenericResponseDto> {
    const floorExists = await this.floorRepository.floorExists(request.name);
    if (floorExists) throw new ConflictError('floor already exists');

    const newFloor = new Floor(DataString.create(request.name));
    await this.floorRepository.create(newFloor);

    return { message: 'floor created' };
  }
}
