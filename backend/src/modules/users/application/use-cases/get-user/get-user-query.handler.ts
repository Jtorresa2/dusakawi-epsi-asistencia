import { NotFoundError } from '@shared/errors/errors.js';
import type { UserRepository } from '../../../domain/repositories/user-repository.js';
import type { GetUserQueryDto } from './get-user-query.dto.js';
import { UserMapper } from '../../mappers/user.mapper.js';
import type { GetUserQueryResponseDto } from './get-user-query-response.dto.js';

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
