import { NotFoundError } from '@shared/errors/errors';
import type { UserRepository } from '@modules/users/domain/repositories/user-repository';
import type { DocumentDetailsCreator } from '@modules/users/domain/services/document-details-creator';
import type { UpdateBasicDataCommandDto } from './update-basic-data-command.dto';

export class UpdateBasicDataCommandHandler {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly documentDetailsCreator: DocumentDetailsCreator,
  ) {}

  async handle(request: UpdateBasicDataCommandDto): Promise<void> {
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
