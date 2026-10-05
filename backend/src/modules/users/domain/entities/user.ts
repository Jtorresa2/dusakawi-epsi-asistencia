import { Area } from '@modules/areas/domain/entities/area';
import { DataString } from '@shared/value-objects/data-string';
import { DocumentDetails } from '../value-objects/document-details';
import { Email } from '../value-objects/email';
import { GenericEntity } from '@shared/entities/generic-entity';
import { HashedPassword } from '../value-objects/hashed-password';
import { Name } from '../value-objects/name';
import { Position } from '@modules/positions/domain/entities/position';
import { Role } from './role';
import type { Metadata } from '@shared/types/metadata';

export interface BasicData {
  documentDetails?: DocumentDetails;
  firstName?: string;
  firstSurname?: string;
  dateOfBirth?: Date;
  placeOfBirth?: string;
  address?: string;
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
    private _placeOfBirth: DataString | null,
    private _address: DataString | null,
    private _position: Position | null,
    private _area: Area | null,
    private _username: DataString | null,
    private _passwordHash: HashedPassword | null,
    private _email: Email | null,
    private _roles: Role[],
    private _middleName?: Name,
    private _secondSurname?: Name,
    private _phone?: DataString,
    metadata?: Metadata | null,
  ) {
    super(metadata);
  }

  get passwordHash(): HashedPassword | null {
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

  get placeOfBirth(): DataString | null {
    return this._placeOfBirth;
  }

  get address(): DataString | null {
    return this._address;
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

  get position(): Position | null {
    return this._position;
  }

  get area(): Area | null {
    return this._area;
  }

  get username(): DataString | null {
    return this._username;
  }

  get email(): Email | null {
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
