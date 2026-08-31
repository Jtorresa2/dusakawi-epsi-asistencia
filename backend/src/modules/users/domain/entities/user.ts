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

export class User extends GenericEntity {
  constructor(
    public readonly documentDetails: DocumentDetails,
    public readonly firstName: Name,
    public readonly firstSurname: Name,
    public readonly dateOfBirth: Date,
    public readonly placeOfBirth: DataString,
    public readonly address: DataString,
    public readonly cell: DataString,
    public readonly position: Position,
    public readonly area: Area,
    public readonly username: DataString,
    private _passwordHash: HashedPassword,
    public readonly email: Email,
    public readonly roles: Role[],
    public readonly middleName?: Name,
    public readonly secondSurname?: Name,
    public readonly phone?: DataString,
    metadata?: Metadata | null,
  ) {
    super(metadata);
  }

  get password(): HashedPassword {
    return this._passwordHash;
  }

  changePassword(passwordHash: HashedPassword) {
    this._passwordHash = passwordHash;
  }
}
