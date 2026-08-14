import { DataString } from '@shared/value-objects/data-string.js';
import { DocumentDetails } from './document-details.js';
import { Email } from '../value-objects/email.js';
import { GenericEntity } from '@shared/entities/generic-entity.js';
import { HashedPassword } from '../value-objects/hashed-password.js';
import { Position } from './position.js';
import { Area } from '../../../areas/entities/area.js';

export class User extends GenericEntity {
  private _password: HashedPassword;

  constructor(
    public readonly documentDetails: DocumentDetails,
    public readonly firstName: DataString,
    public readonly firstSurname: DataString,
    public readonly secondSurname: DataString,
    public readonly dateOfBirth: Date,
    public readonly placeOfBirth: string,
    public readonly address: DataString,
    public readonly cell: DataString,
    public readonly position: Position,
    public readonly area: Area,
    public readonly username: DataString,
    password: HashedPassword,
    public readonly email: Email,
    public readonly middleName?: DataString,
    public readonly phone?: DataString,
  ) {
    super();
    this._password = password;
  }

  get password(): HashedPassword {
    return this._password;
  }

  changePassword(password: HashedPassword) {
    this._password = password;
  }
}
