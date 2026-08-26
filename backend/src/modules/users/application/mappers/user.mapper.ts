import type { User } from '../../domain/entities/user.js';
import type { UserDetailsDto } from '../common/dtos/user-details.dto.js';

export class UserMapper {
  static toUserResponseDto(user: User): UserDetailsDto {
    const roles = user.roles.map((role) => ({
      id: role.metadata.id,
      name: role.name.value,
    }));

    return {
      id: user.metadata.id,
      firstName: user.firstName.value,
      middleName: user.middleName?.value,
      firstSurname: user.firstSurname.value,
      secondSurname: user.secondSurname?.value,
      username: user.username.value,
      email: user.email.value,
      cell: user.cell.value,
      phone: user.phone?.value,
      address: user.address.value,
      dateOfBirth: user.dateOfBirth,
      placeOfBirth: user.placeOfBirth.value,
      documentDetails: {
        documentType: user.documentDetails.documentType.name,
        documentNumber: user.documentDetails.documentNumber.value,
        issueDate: user.documentDetails.issueDate,
        placeOfIssue: user.documentDetails.placeOfIssue.value,
      },
      area: {
        id: user.area.metadata.id,
        name: user.area.name.value,
      },
      position: {
        id: user.area.metadata.id,
        name: user.area.name.value,
      },
      roles: roles,
      createdAt: user.metadata.createdAt,
      updatedAt: user.metadata.updatedAt,
    };
  }
}
