import { Area } from '../../../../areas/domain/entities/area.js';
import { DocumentDetails } from '../../value-objects/document-details.js';
import { Position } from '../../entities/position.js';
import { Role } from '../../entities/role.js';
import { User } from '../../entities/user.js';
import { HashedPassword } from '../../value-objects/hashed-password.js';
import { UserBuilder } from '../../interfaces/user-builder.js';
import type { Metadata } from '@shared/types/metadata.js';

export class UserBuilderDirector {
  constructor(private userBuilder: UserBuilder) {}

  basicData(
    firstName: string,
    firstSurname: string,
    secondSurname: string,
    documentDetails: DocumentDetails,
    dateOfBirth: Date,
    placeOfBirth: string,
    address: string,
    cell: string,
    phone?: string,
    middleName?: string,
    metadata: Metadata | null = null,
  ): UserBuilderDirector {
    this.userBuilder
      .metadata(metadata)
      .documentDetails(documentDetails)
      .firstName(firstName)
      .middleName(middleName)
      .firstSurname(firstSurname)
      .secondSurname(secondSurname)
      .dateOfBirth(dateOfBirth)
      .placeOfBirth(placeOfBirth)
      .address(address)
      .cell(cell)
      .phone(phone);

    return this;
  }

  workData(position: Position, area: Area, roles: Role[]): UserBuilderDirector {
    this.userBuilder.position(position).area(area).roles(roles);
    return this;
  }

  authData(
    username: string,
    hashedPassword: HashedPassword,
    email: string,
  ): UserBuilderDirector {
    this.userBuilder.username(username).password(hashedPassword).email(email);
    return this;
  }

  build(): User {
    return this.userBuilder.build();
  }
}
