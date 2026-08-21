import { Area } from '../../../../areas/domain/entities/area.js';
import { DataString } from '@shared/value-objects/data-string.js';
import { DocumentDetails } from '../../value-objects/document-details.js';
import { Email } from '../../value-objects/email.js';
import { HashedPassword } from '../../value-objects/hashed-password.js';
import { Name } from '../../value-objects/name.js';
import { Position } from '../../entities/position.js';
import { Role } from '../../entities/role.js';
import { User } from '../../entities/user.js';
import type { UserBuilder } from '../../interfaces/user-builder.js';
import type { Metadata } from '@shared/types/metadata.js';

export class UserDatabaseBuilder implements UserBuilder {
  private _documentDetails?: DocumentDetails;
  private _firstName?: Name;
  private _middleName?: Name;
  private _firstSurname?: Name;
  private _secondSurname?: Name;
  private _dateOfBirth?: Date;
  private _placeOfBirth?: DataString;
  private _address?: DataString;
  private _phone?: DataString;
  private _cell?: DataString;
  private _position?: Position;
  private _area?: Area;
  private _username?: DataString;
  private _passwordHash?: HashedPassword;
  private _email?: Email;
  private _roles?: Role[];
  private _metadata?: Metadata | null;

  documentDetails(documentDetails: DocumentDetails): this {
    this._documentDetails = documentDetails;
    return this;
  }

  firstName(firstName: string): this {
    this._firstName = Name.create(firstName);
    return this;
  }

  middleName(middleName?: string): this {
    this._middleName = middleName ? Name.create(middleName) : undefined;
    return this;
  }

  firstSurname(firstSurname: string): this {
    this._firstSurname = Name.create(firstSurname);
    return this;
  }

  secondSurname(secondSurname?: string): this {
    this._secondSurname = secondSurname
      ? Name.create(secondSurname)
      : undefined;
    return this;
  }

  dateOfBirth(dateOfBirth: Date): this {
    this._dateOfBirth = dateOfBirth;
    return this;
  }

  placeOfBirth(placeOfBirth: string): this {
    this._placeOfBirth = DataString.create(placeOfBirth);
    return this;
  }

  address(address: string): this {
    this._address = DataString.create(address);
    return this;
  }

  phone(phone?: string): this {
    this._phone = phone ? DataString.create(phone) : undefined;
    return this;
  }

  cell(cell: string): this {
    this._cell = DataString.create(cell);
    return this;
  }

  position(position: Position): this {
    this._position = position;
    return this;
  }

  area(area: Area): this {
    this._area = area;
    return this;
  }

  username(username: string): this {
    this._username = DataString.create(username);
    return this;
  }

  passwordHash(passwordHash: HashedPassword): this {
    this._passwordHash = passwordHash;
    return this;
  }

  email(email: string): this {
    this._email = Email.create(email);
    return this;
  }

  roles(roles: Role[]): this {
    this._roles = roles;
    return this;
  }

  metadata(metadata: Metadata | null): this {
    this._metadata = metadata;
    return this;
  }

  build(): User {
    return new User(
      this._documentDetails!,
      this._firstName!,
      this._firstSurname!,
      this._dateOfBirth!,
      this._placeOfBirth!,
      this._address!,
      this._cell!,
      this._position!,
      this._area!,
      this._username!,
      this._passwordHash!,
      this._email!,
      this._roles!,
      this._middleName,
      this._secondSurname,
      this._phone,
      this._metadata,
    );
  }
}
