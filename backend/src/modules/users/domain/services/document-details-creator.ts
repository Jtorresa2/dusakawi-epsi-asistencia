import { Uuid } from '@shared/types/uuid.js';
import { DocumentDetails } from '../entities/document-details.js';
import { DocumentTypeRepository } from '../repositories/document-type-repository.js';
import { DocumentNumber } from '../value-objects/document-number.js';
import { DataString } from '@shared/value-objects/data-string.js';

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
    if (!documentType) throw new Error(documentTypeId);

    return new DocumentDetails(
      documentType,
      DocumentNumber.create(documentNumber),
      issueDate,
      DataString.create(placeOfIssue),
    );
  }
}
