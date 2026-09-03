import type { UserRepository } from '../../../domain/repositories/user-repository.js';
import { PagedListDto } from '../../common/dtos/paged-list.dto.js';
import type { UserDetailsDto } from '../../common/dtos/user-details.dto.js';
import { UserMapper } from '../../mappers/user.mapper.js';
import type { GetUsersQueryDto } from './get-users-query.dto.js';

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
