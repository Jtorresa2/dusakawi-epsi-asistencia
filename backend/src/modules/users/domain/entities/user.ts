import { Area } from '../../../areas/domain/entities/area.js';
import { DataString } from '@shared/value-objects/data-string.js';
import { DocumentDetails } from '../value-objects/document-details.js';
import { Email } from '../value-objects/email.js';
import { GenericEntity } from '@shared/entities/generic-entity.js';
import { HashedPassword } from '../value-objects/hashed-password.js';
import { Name } from '../value-objects/name.js';
import { Position } from './position.js';
import { Role } from './role.js';
import type { Metadata } from '@shared/types/metadata.js';

export interface BasicData {
  documentDetails?: DocumentDetails;
  firstName?: string;
  firstSurname?: string;
  dateOfBirth?: Date;
  placeOfBirth?: string;
  address?: string;
  cell?: string;
  middleName?: string;
  secondSurname?: string;
  phone?: string;
}

export class User extends GenericEntity {
  constructor(
    private _documentDetails: DocumentDetails,
    private _firstName: Name,
    private _firstSurname: Name,
    private _dateOfBirth: Date,
    private _placeOfBirth: DataString,
    private _address: DataString,
    private _cell: DataString,
    public readonly position: Position,
    public readonly area: Area,
    public readonly username: DataString,
    private _passwordHash: HashedPassword,
    public readonly email: Email,
    public readonly roles: Role[],
    private _middleName?: Name,
    private _secondSurname?: Name,
    private _phone?: DataString,
    metadata?: Metadata | null,
  ) {
    super(metadata);
  }

  get passwordHash(): HashedPassword {
    return this._passwordHash;
  }

  get documentDetails(): DocumentDetails {
    return this._documentDetails;
  }

  get firstName(): Name {
    return this._firstName;
  }

  get firstSurname(): Name {
    return this._firstSurname;
  }

  get dateOfBirth(): Date {
    return this._dateOfBirth;
  }

  get placeOfBirth(): DataString {
    return this._placeOfBirth;
  }

  get address(): DataString {
    return this._address;
  }

  get cell(): DataString {
    return this._cell;
  }

  get middleName(): Name | undefined {
    return this._middleName;
  }

  get secondSurname(): Name | undefined {
    return this._secondSurname;
  }

  get phone(): DataString | undefined {
    return this._phone;
  }

  changePassword(passwordHash: HashedPassword) {
    this._passwordHash = passwordHash;
  }

  changeBasicData(basicData: BasicData) {
    this._documentDetails = basicData.documentDetails ?? this._documentDetails;
    this._firstName = basicData.firstName
      ? Name.create(basicData.firstName)
      : this._firstName;
    this._firstSurname = basicData.firstSurname
      ? Name.create(basicData.firstSurname)
      : this._firstSurname;
    this._middleName = basicData.middleName
      ? Name.create(basicData.middleName)
      : this._middleName;
    this._secondSurname = basicData.secondSurname
      ? Name.create(basicData.secondSurname)
      : this._secondSurname;
    this._dateOfBirth = basicData.dateOfBirth ?? this._dateOfBirth;
    this._placeOfBirth = basicData.placeOfBirth
      ? DataString.create(basicData.placeOfBirth)
      : this._placeOfBirth;
    this._address = basicData.address
      ? DataString.create(basicData.address)
      : this._address;
    this._cell = basicData.cell
      ? DataString.create(basicData.cell)
      : this._cell;
    this._phone = basicData.phone
      ? DataString.create(basicData.phone)
      : this._phone;

    this.metadata.updatedAt = new Date();
  }
}
