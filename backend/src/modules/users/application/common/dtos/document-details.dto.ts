import type { Uuid } from '@shared/types/uuid';

export interface DocumentDetailsDto {
  documentTypeId: Uuid;
  number: string;
  issueDate: Date;
  placeOfIssue: string;
}
