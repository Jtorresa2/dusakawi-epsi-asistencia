import { NotFoundError } from '@shared/errors/errors';
import type { UserRepository } from '@modules/users/domain/repositories/user-repository';
import type { GetUserQueryDto } from './get-user-query.dto';
import type { GetUserQueryResponseDto } from './get-user-query-response.dto';
import { UserMapper } from '../../mappers/user.mapper';

export class GetUserQueryHandler {
  constructor(private userRepository: UserRepository) {}

  async handle(request: GetUserQueryDto): Promise<GetUserQueryResponseDto> {
    const user = await this.userRepository.findById(request.id);
    if (!user) throw new NotFoundError('user');

    return {
      user: UserMapper.toUserResponseDto(user),
    };
  }
}
