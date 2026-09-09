import { Area } from '@modules/areas/domain/entities/area';
import { DataString } from '@shared/value-objects/data-string';
import { DocumentDetails } from '../value-objects/document-details';
import { Email } from '../value-objects/email';
import { GenericEntity } from '@shared/entities/generic-entity';
import { HashedPassword } from '../value-objects/hashed-password';
import { Name } from '../value-objects/name';
import { Position } from './position';
import { Role } from './role';
import type { Metadata } from '@shared/types/metadata';

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

export interface WorkData {
  position?: Position;
  area?: Area;
  roles?: Role[];
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
    private _position: Position,
    private _area: Area,
    private _username: DataString,
    private _passwordHash: HashedPassword,
    private _email: Email,
    private _roles: Role[],
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

  get position(): Position {
    return this._position;
  }

  get area(): Area {
    return this._area;
  }

  get username(): DataString {
    return this._username;
  }

  get email(): Email {
    return this._email;
  }

  get roles(): Role[] {
    return this._roles;
  }

  role(name: string): Role | undefined {
    return this._roles.find((role) => role.name.value === name);
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

  changeWorkData(workData: WorkData) {
    this._position = workData.position ?? this._position;
    this._area = workData.area ?? this._area;
    this._roles = workData.roles ?? this._roles;
    this.metadata.updatedAt = new Date();
  }
}
