import type { FloorRepository } from '@modules/areas/domain/repositories/floor-repository';
import type { UpdateFloorCommandDto } from './update-floor-command.dto';
import { NotFoundError } from '@shared/errors/errors';

export class UpdateFloorCommandHandler {
  constructor(private readonly floorRepository: FloorRepository) {}

  async handle(request: UpdateFloorCommandDto) {
    const floor = await this.floorRepository.findById(request.id);
    if (!floor) throw new NotFoundError('floor');

    floor.updateData({ name: request.name });

    await this.floorRepository.update(request.id, floor);
  }
}
