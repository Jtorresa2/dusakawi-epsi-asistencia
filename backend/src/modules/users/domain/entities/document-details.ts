import { DataString } from '@shared/value-objects/data-string.js';
import { DocumentNumber } from '../value-objects/document-number.js';
import { DocumentType } from './document-type.js';
import { GenericEntity } from '@shared/entities/generic-entity.js';

export class DocumentDetails extends GenericEntity {
  constructor(
    public readonly documentType: DocumentType,
    public readonly documentNumber: DocumentNumber,
    public readonly issueDate: Date,
    public readonly placeOfIssue: DataString,
  ) {
    super();
  }
}
