import { PagedListDto } from '@shared/dtos/paged-list.dto';
import type { UserRepository } from '@modules/users/domain/repositories/user-repository';
import { UserMapper } from '../../mappers/user.mapper';
import type { GetUsersQueryDto } from './get-users-query.dto';
import type { UserDetailsDto } from '../../common/dtos/user-details.dto';

export class GetUsersQueryHandler {
  constructor(private readonly userRepository: UserRepository) {}

  async handle(
    request: GetUsersQueryDto,
  ): Promise<PagedListDto<UserDetailsDto>> {
    const { page = 1, limit = 10, query } = request;

    const { total, items } = await this.userRepository.findAll({
      page,
      limit,
      query,
    });

    return PagedListDto.create<UserDetailsDto>(
      total,
      page,
      limit,
      items.map((user) => UserMapper.toUserResponseDto(user)),
    );
  }
}
