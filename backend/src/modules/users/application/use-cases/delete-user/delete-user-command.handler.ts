import { NotFoundError } from '@shared/errors/errors';
import type { UserRepository } from '@modules/users/domain/repositories/user-repository';
import type { DeleteUserCommandDto } from './delete-user-command.dto';

export class DeleteUserCommandHandler {
  constructor(private readonly userRepository: UserRepository) {}

  async handle(request: DeleteUserCommandDto): Promise<void> {
    const userExist = await this.userRepository.findById(request.id);
    if (!userExist) throw new NotFoundError('user');

    await this.userRepository.delete(request.id);
  }
}
