import type { AreaRepository } from '@modules/areas/domain/repositories/area-repository';
import type { FloorRepository } from '@modules/areas/domain/repositories/floor-repository';
import type { UpdateAreaCommandDto } from './update-area-command.dto';
import { NotFoundError } from '@shared/errors/errors';

export class UpdateAreaCommandHandler {
  constructor(
    private readonly areaRepository: AreaRepository,
    private readonly floorRepository: FloorRepository,
  ) {}

  async handle(request: UpdateAreaCommandDto) {
    let floor;
    if (request.floorId) {
      floor = await this.floorRepository.findById(request.floorId);
      if (!floor) throw new NotFoundError('floor');
    }

    const area = await this.areaRepository.findById(request.id);
    if (!area) throw new NotFoundError('area');

    area.updateData({
      floor,
      name: request.name,
      description: request.description,
    });

    await this.areaRepository.update(request.id, area);
  }
}
