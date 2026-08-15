import { Uuid } from '@shared/types/uuid.js';

export interface DocumentDetailsDto {
  documentTypeId: Uuid;
  number: string;
  issueDate: Date;
  placeOfIssue: string;
}
