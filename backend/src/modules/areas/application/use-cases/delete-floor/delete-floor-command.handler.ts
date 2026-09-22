import type { FloorRepository } from '@modules/areas/domain/repositories/floor-repository';
import type { DeleteFloorCommandDto } from './delete-floor-command.dto';
import { NotFoundError } from '@shared/errors/errors';

export class DeleteFloorCommandHandler {
  constructor(private readonly floorRepository: FloorRepository) {}

  async handle(request: DeleteFloorCommandDto) {
    const floor = await this.floorRepository.findById(request.id);
    if (!floor) throw new NotFoundError('floor');

    await this.floorRepository.delete(request.id);
  }
}
