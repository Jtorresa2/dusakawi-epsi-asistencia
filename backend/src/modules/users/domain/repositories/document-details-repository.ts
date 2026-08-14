import { GenericRepository } from '@shared/repositories/generic-repository.js';
import { DocumentType } from '../entities/document-type.js';
import { DocumentNumber } from '../value-objects/document-number.js';
import { DocumentDetails } from '../entities/document-details.js';

export interface DocumentDetailsRepository extends GenericRepository<DocumentDetails> {
  getDocumentDetailByType(documentType: DocumentType): Promise<DocumentDetails>;
  getDocumentDetailsByNumber(
    documentNumber: DocumentNumber,
  ): Promise<DocumentDetails>;
}
