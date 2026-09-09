import type { Uuid } from '@shared/types/uuid';
import type { DocumentDetailsDto } from '@modules/users/application/common/dtos/document-details.dto';

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
