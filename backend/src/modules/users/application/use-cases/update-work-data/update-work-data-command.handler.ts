import { NotFoundError } from '@shared/errors/errors';
import type { WorkData } from '@modules/users/domain/entities/user';
import type { AreaRepository } from '@modules/areas/domain/repositories/area-repository';
import type { PositionRepository } from '@modules/positions/domain/repositories/position-repository';
import type { RoleRepository } from '@modules/users/domain/repositories/role-repository';
import type { UserRepository } from '@modules/users/domain/repositories/user-repository';
import type { UpdateWorkDataCommandDto } from './update-work-data-command.dto';

export class UpdateWorkDataCommandHandler {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly positionRepository: PositionRepository,
    private readonly areaRepository: AreaRepository,
    private readonly roleRepository: RoleRepository,
  ) {}

  async handle(request: UpdateWorkDataCommandDto): Promise<void> {
    const user = await this.userRepository.findById(request.id);
    if (!user) throw new NotFoundError('user');

    const workData: WorkData = {};

    if (request.positionId) {
      const position = await this.positionRepository.findById(
        request.positionId,
      );
      if (!position) throw new NotFoundError('position');
      workData.position = position;
    }

    if (request.areaId) {
      const area = await this.areaRepository.findById(request.areaId);
      if (!area) throw new NotFoundError('area');
      workData.area = area;
    }

    if (request.roles) {
      const roles = await this.roleRepository.getRolesByName(request.roles);
      if (roles.length === 0) throw new NotFoundError('roles');
      workData.roles = roles;
    }

    user.changeWorkData(workData);

    await this.userRepository.update(request.id, user);
  }
}
