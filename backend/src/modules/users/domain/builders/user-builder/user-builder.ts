import { DataString } from '@shared/value-objects/data-string.js';
import { DocumentDetails } from '../../entities/document-details.js';
import { User } from '../../entities/user.js';
import { Area } from '../../../../areas/entities/area.js';
import { Position } from '../../entities/position.js';
import { Email } from '../../value-objects/email.js';
import { HashedPassword } from '../../value-objects/hashed-password.js';
import { Builder } from '../../interfaces/builder.js';

export class UserBuilder implements Builder<User> {
  private _documentDetails?: DocumentDetails;
  private _firstName?: DataString;
  private _middleName?: DataString;
  private _firstSurname?: DataString;
  private _secondSurname?: DataString;
  private _dateOfBirth?: Date;
  private _placeOfBirth?: string;
  private _address?: DataString;
  private _phone?: DataString;
  private _cell?: DataString;
  private _position?: Position;
  private _area?: Area;
  private _username?: DataString;
  private _password?: HashedPassword;
  private _email?: Email;

  documentDetails(documentDetails: DocumentDetails): this {
    this._documentDetails = documentDetails;
    return this;
  }

  firstName(firstName: DataString): this {
    this._firstName = firstName;
    return this;
  }

  middleName(middleName?: DataString): this {
    this._middleName = middleName;
    return this;
  }

  firstSurname(firstSurname: DataString): this {
    this._firstSurname = firstSurname;
    return this;
  }

  secondSurname(secondSurname: DataString): this {
    this._secondSurname = secondSurname;
    return this;
  }

  dateOfBirth(dateOfBirth: Date): this {
    this._dateOfBirth = dateOfBirth;
    return this;
  }

  placeOfBirth(placeOfBirth: string): this {
    this._placeOfBirth = placeOfBirth;
    return this;
  }

  address(address: DataString): this {
    this._address = address;
    return this;
  }

  phone(phone?: DataString): this {
    this._phone = phone;
    return this;
  }

  cell(cell: DataString): this {
    this._cell = cell;
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

  username(username: DataString): this {
    this._username = username;
    return this;
  }

  password(password: HashedPassword): this {
    this._password = password;
    return this;
  }

  email(email: Email): this {
    this._email = email;
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
      this._middleName,
      this._phone,
    );
  }
}
