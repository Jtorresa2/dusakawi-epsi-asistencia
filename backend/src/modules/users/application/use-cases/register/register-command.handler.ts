import { AreaRepository } from '../../../../areas/domain/repositories/area-repository.js';
import { PasswordHasher } from '../../../domain/interfaces/password-hasher.js';
import { PositionRepository } from '../../../domain/repositories/position-repository.js';
import { RegisterCommandDto } from './register-command.dto.js';
import { RoleRepository } from '../../../domain/repositories/role-repository.js';
import { UnitOfWork } from '../../../domain/interfaces/unit-of-work.js';
import { UserDatabaseBuilder } from '../../../domain/builders/user-builder/user-database-builder.js';
import { UserBuilderDirector } from '../../../domain/builders/user-builder/user-builder-director.js';
import { UserRepository } from '../../../domain/repositories/user-repository.js';
import { DocumentDetailsCreator } from '../../../domain/services/document-details-creator.js';

export class RegisterCommandHandler {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly positionRepository: PositionRepository,
    private readonly areaRepository: AreaRepository,
    private readonly roleRepository: RoleRepository,
    private readonly documentDetailsCreator: DocumentDetailsCreator,
    private readonly passwordHasher: PasswordHasher,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async handle(request: RegisterCommandDto): Promise<void> {
    const userExist = await this.userRepository.getUserExists(request.username);
    if (userExist) throw new Error('User already exist');

    const documentExist = await this.userRepository.getUserExistsByDocument(
      request.documentDetails.number,
    );
    if (documentExist) throw new Error('Document already exist');

    const position = await this.positionRepository.findById(request.positionId);
    if (!position) throw new Error('Position not found');

    const area = await this.areaRepository.findById(request.areaId);
    if (!area) throw new Error('Area not found');

    const roles = await this.roleRepository.getRolesByName(request.roles);
    if (roles.length === 0) throw new Error('Roles not found');

    const documentDetails = await this.documentDetailsCreator.create(
      request.documentDetails.documentTypeId,
      request.documentDetails.number,
      request.documentDetails.issueDate,
      request.documentDetails.placeOfIssue,
    );

    const hashedPassword = await this.passwordHasher.hash(request.password);

    const newUser = new UserBuilderDirector(new UserDatabaseBuilder())
      .basicData(
        request.firstName,
        request.firstSurname,
        request.secondSurname,
        documentDetails,
        request.dateOfBirth,
        request.placeOfBirth,
        request.address,
        request.cell,
        request.phone,
        request.middleName,
      )
      .workData(position, area, roles)
      .authData(request.username, hashedPassword, request.email)
      .build();

    await this.userRepository.create(newUser);
    await this.unitOfWork.save();
  }
}
