import { NotFoundError } from '@shared/errors/errors.js';
import type { UserRepository } from '../../../domain/repositories/user-repository.js';
import type { UpdateUserBasicDataCommandDto } from './update-user-basic-data-command.dto.js';
import type { DocumentDetailsCreator } from '../../../domain/services/document-details-creator.js';

export class UpdateUserBasicDataCommandHandler {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly documentDetailsCreator: DocumentDetailsCreator,
  ) {}

  async handle(request: UpdateUserBasicDataCommandDto): Promise<void> {
    const user = await this.userRepository.findById(request.id);
    if (!user) throw new NotFoundError('user');

    const documentDetails = request.documentDetails
      ? await this.documentDetailsCreator.create(
          request.documentDetails.documentTypeId,
          request.documentDetails.number,
          request.documentDetails.issueDate,
          request.documentDetails.placeOfIssue,
        )
      : undefined;

    user.changeBasicData({
      ...request,
      documentDetails,
    });

    await this.userRepository.update(request.id, user);
  }
}
