import type { Uuid } from '@shared/types/uuid.js';
import type { DocumentDetailsDto } from './document-details.dto.js';

export interface RegisterCommandDto {
  documentDetails: DocumentDetailsDto;
  firstName: string;
  middleName?: string;
  firstSurname: string;
  secondSurname: string;
  username: string;
  email: string;
  password: string;
  dateOfBirth: Date;
  placeOfBirth: string;
  address: string;
  cell: string;
  phone?: string;
  areaId: Uuid;
  positionId: Uuid;
  roles: string[];
}
