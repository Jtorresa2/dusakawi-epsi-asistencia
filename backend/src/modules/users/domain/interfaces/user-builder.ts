import type { Metadata } from '@shared/types/metadata.js';
import { Area } from '../../../areas/domain/entities/area.js';
import { Position } from '../entities/position.js';
import { Role } from '../entities/role.js';
import { User } from '../entities/user.js';
import { DocumentDetails } from '../value-objects/document-details.js';
import { HashedPassword } from '../value-objects/hashed-password.js';
import { Builder } from './builder.js';

export interface UserBuilder extends Builder<User> {
  documentDetails(documentDetails: DocumentDetails): this;
  firstName(firstName: string): this;
  middleName(middleName?: string): this;
  firstSurname(firstSurname: string): this;
  secondSurname(secondSurname: string): this;
  dateOfBirth(dateOfBirth: Date): this;
  placeOfBirth(placeOfBirth: string): this;
  address(address: string): this;
  phone(phone?: string): this;
  cell(cell: string): this;
  position(position: Position): this;
  area(area: Area): this;
  username(username: string): this;
  password(password: HashedPassword): this;
  email(email: string): this;
  roles(roles: Role[]): this;
  metadata(metadata: Metadata | null): this;
}
