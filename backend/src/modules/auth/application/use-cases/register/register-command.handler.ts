import type { AreaRepository } from '@modules/areas/domain/repositories/area-repository';
import type { PositionRepository } from '@modules/positions/domain/repositories/position-repository';
import type { RegisterCommandDto } from './register-command.dto';
import type { RoleRepository } from '@modules/users/domain/repositories/role-repository';
import { UserDatabaseBuilder } from '@modules/users/domain/builders/user-builder/user-database-builder';
import { UserBuilderDirector } from '@modules/users/domain/builders/user-builder/user-builder-director';
import type { UserRepository } from '@modules/users/domain/repositories/user-repository';
import { DocumentDetailsCreator } from '@modules/users/domain/services/document-details-creator';
import type { GenericResponseDto } from '@shared/dtos/generic-response.dto';
import { ConflictError, NotFoundError } from '@shared/errors/errors';
import { PlainPassword } from '@modules/users/domain/value-objects/plain-password';
import type { PasswordHasher } from '@modules/auth/domain/interfaces/password-hasher';

export class RegisterCommandHandler {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly positionRepository: PositionRepository,
    private readonly areaRepository: AreaRepository,
    private readonly roleRepository: RoleRepository,
    private readonly documentDetailsCreator: DocumentDetailsCreator,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async handle(request: RegisterCommandDto): Promise<GenericResponseDto> {
    const userExist = await this.userRepository.getUserExists(request.username);
    if (userExist) throw new ConflictError('user already exist');

    const documentExist = await this.userRepository.getUserExistsByDocument(
      request.documentDetails.number,
    );
    if (documentExist) throw new ConflictError('document already exist');

    const emailExist = await this.userRepository.getUserExistsByEmail(
      request.email,
    );
    if (emailExist) throw new ConflictError('email already exist');

    const position = await this.positionRepository.findById(request.positionId);
    if (!position) throw new NotFoundError('position');

    const area = await this.areaRepository.findById(request.areaId);
    if (!area) throw new NotFoundError('area');

    const roles = await this.roleRepository.getRolesByName(request.roles);
    if (roles.length === 0) throw new ConflictError('roles');

    const documentDetails = await this.documentDetailsCreator.create(
      request.documentDetails.documentTypeId,
      request.documentDetails.number,
      request.documentDetails.issueDate,
      request.documentDetails.placeOfIssue,
    );

    const plainPassword = PlainPassword.create(request.password);
    const hashedPassword = await this.passwordHasher.hash(plainPassword);

    const newUser = new UserBuilderDirector(new UserDatabaseBuilder())
      .basicData(
        request.firstName,
        request.firstSurname,
        documentDetails,
        request.dateOfBirth,
        request.placeOfBirth,
        request.address,
        request.cell,
        request.phone,
        request.middleName,
        request.secondSurname,
      )
      .workData(position, area, roles)
      .authData(request.username, hashedPassword, request.email)
      .build();

    await this.userRepository.create(newUser);

    return { message: 'User created' };
  }
}
