import type { Metadata } from '@shared/types/metadata';
import { Area } from '@modules/areas/domain/entities/area';
import { Position } from '../entities/position';
import { Role } from '../entities/role';
import { User } from '../entities/user';
import { DocumentDetails } from '../value-objects/document-details';
import { HashedPassword } from '../value-objects/hashed-password';
import type { Builder } from './builder';

export interface UserBuilder extends Builder<User> {
  documentDetails(documentDetails: DocumentDetails): this;
  firstName(firstName: string): this;
  middleName(middleName?: string): this;
  firstSurname(firstSurname: string): this;
  secondSurname(secondSurname?: string): this;
  dateOfBirth(dateOfBirth: Date): this;
  placeOfBirth(placeOfBirth: string): this;
  address(address: string): this;
  phone(phone?: string): this;
  cell(cell: string): this;
  position(position: Position): this;
  area(area: Area): this;
  username(username: string): this;
  passwordHash(passwordHash: HashedPassword): this;
  email(email: string): this;
  roles(roles: Role[]): this;
  metadata(metadata?: Metadata | null): this;
}
