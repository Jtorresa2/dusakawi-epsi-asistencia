import { DataString } from '@shared/value-objects/data-string';
import { DocumentNumber } from './document-number';
import { DocumentType } from '../entities/document-type';

export class DocumentDetails {
  private constructor(
    public readonly documentType: DocumentType,
    public readonly documentNumber: DocumentNumber,
    public readonly issueDate: Date,
    public readonly placeOfIssue: DataString,
  ) {}

  static create(
    documentType: DocumentType,
    documentNumber: DocumentNumber,
    issueDate: Date,
    placeOfIssue: DataString,
  ) {
    return new DocumentDetails(
      documentType,
      documentNumber,
      issueDate,
      placeOfIssue,
    );
  }

  equals(other: DocumentDetails): boolean {
    return (
      this.documentType.equals(other.documentType) &&
      this.documentNumber.equals(other.documentNumber) &&
      this.issueDate.getTime() === other.issueDate.getTime() &&
      this.placeOfIssue.equals(other.placeOfIssue)
    );
  }
}
