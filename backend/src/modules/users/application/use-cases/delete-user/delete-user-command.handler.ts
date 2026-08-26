import { NotFoundError } from '@shared/errors/errors.js';
import type { UserRepository } from '../../../domain/repositories/user-repository.js';
import type { DeleteUserCommandDto } from './delete-user-command.dto.js';

export class DeleteUserCommandHandler {
  constructor(private readonly userRepository: UserRepository) {}

  async handle(request: DeleteUserCommandDto): Promise<void> {
    const userExist = await this.userRepository.findById(request.id);
    if (!userExist) throw new NotFoundError('user');

    return await this.userRepository.delete(request.id);
  }
}
