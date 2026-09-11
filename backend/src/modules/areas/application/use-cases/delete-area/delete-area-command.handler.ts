import type { AreaRepository } from '@modules/areas/domain/repositories/area-repository';
import type { DeleteAreaCommandDto } from './delete-area-command.dto';
import { NotFoundError } from '@shared/errors/errors';

export class DeleteAreaCommandHandler {
  constructor(private readonly areaRepository: AreaRepository) {}

  async handle(request: DeleteAreaCommandDto) {
    const area = await this.areaRepository.findById(request.id);
    if (!area) throw new NotFoundError('area');

    await this.areaRepository.delete(request.id);
  }
}
