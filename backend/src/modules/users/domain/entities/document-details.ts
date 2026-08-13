import { DocumentType } from './document-type.js';
import { GenericEntity } from '@shared/entities/generic-entity.js';
import { DataString } from '@shared/value-objects/data-string.js';

export class DocumentDetails extends GenericEntity {
  constructor(
    public readonly documentType: DocumentType,
    public readonly documentNumber: DataString,
    public readonly issue_date: Date,
    public readonly place_of_issue: string,
  ) {
    super();
  }
}
