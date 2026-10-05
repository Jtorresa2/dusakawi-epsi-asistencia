import { DataString } from '@shared/value-objects/data-string';
import { DocumentNumber } from './document-number';
import { DocumentType } from '@modules/document-types/domain/entities/document-type';

export class DocumentDetails {
  private constructor(
    public readonly documentType: DocumentType,
    public readonly documentNumber: DocumentNumber,
    // issueDate y placeOfIssue son opcionales: los empleados importados desde
    // el ERP no traen esa información y se deja en null en vez de inventarla.
    public readonly issueDate: Date | null,
    public readonly placeOfIssue: DataString | null,
  ) {}

  static create(
    documentType: DocumentType,
    documentNumber: DocumentNumber,
    issueDate: Date | null,
    placeOfIssue: DataString | null,
  ) {
    return new DocumentDetails(
      documentType,
      documentNumber,
      issueDate,
      placeOfIssue,
    );
  }

  equals(other: DocumentDetails): boolean {
    const sameIssueDate =
      this.issueDate === other.issueDate
        ? true
        : this.issueDate !== null &&
          other.issueDate !== null &&
          this.issueDate.getTime() === other.issueDate.getTime();
    const samePlaceOfIssue =
      this.placeOfIssue === other.placeOfIssue
        ? true
        : this.placeOfIssue !== null &&
          other.placeOfIssue !== null &&
          this.placeOfIssue.equals(other.placeOfIssue);

    return (
      this.documentType.equals(other.documentType) &&
      this.documentNumber.equals(other.documentNumber) &&
      sameIssueDate &&
      samePlaceOfIssue
    );
  }
}
