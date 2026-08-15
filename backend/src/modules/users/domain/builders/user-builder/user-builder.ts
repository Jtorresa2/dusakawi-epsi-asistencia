import { DataString } from '@shared/value-objects/data-string.js';
import { DocumentDetails } from '../../value-objects/document-details.js';
import { User } from '../../entities/user.js';
import { Area } from '../../../../areas/entities/area.js';
import { Position } from '../../entities/position.js';
import { Email } from '../../value-objects/email.js';
import { HashedPassword } from '../../value-objects/hashed-password.js';
import { Builder } from '../../interfaces/builder.js';
import { Name } from '../../value-objects/name.js';
import { Role } from '../../entities/role.js';

export class UserBuilder implements Builder<User> {
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
  private _password?: HashedPassword;
  private _email?: Email;
  private _roles?: Role[];

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

  secondSurname(secondSurname: string): this {
    this._secondSurname = Name.create(secondSurname);
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

  password(password: HashedPassword): this {
    this._password = password;
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

  build(): User {
    return new User(
      this._documentDetails!,
      this._firstName!,
      this._firstSurname!,
      this._secondSurname!,
      this._dateOfBirth!,
      this._placeOfBirth!,
      this._address!,
      this._cell!,
      this._position!,
      this._area!,
      this._username!,
      this._password!,
      this._email!,
      this._roles!,
      this._middleName,
      this._phone,
    );
  }
}
