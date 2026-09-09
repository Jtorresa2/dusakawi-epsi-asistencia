import type { Uuid } from '@shared/types/uuid';
import { DocumentDetails } from '../value-objects/document-details';
import type { DocumentTypeRepository } from '@modules/document-types/domain/repositories/document-type-repository';
import { DocumentNumber } from '../value-objects/document-number';
import { DataString } from '@shared/value-objects/data-string';
import { ValidationError } from '@shared/errors/errors';

export class DocumentDetailsCreator {
  constructor(
    private readonly documentTypeRepository: DocumentTypeRepository,
  ) {}

  async create(
    documentTypeId: Uuid,
    documentNumber: string,
    issueDate: Date,
    placeOfIssue: string,
  ): Promise<DocumentDetails> {
    const documentType =
      await this.documentTypeRepository.findById(documentTypeId);
    if (!documentType) throw new ValidationError('documentType not found');

    return DocumentDetails.create(
      documentType,
      DocumentNumber.create(documentNumber),
      issueDate,
      DataString.create(placeOfIssue),
    );
  }
}
