import { GenericRepository } from '@shared/repositories/generic-repository.js';
import { DocumentType, DocumentTypeName } from '../entities/document-type.js';

export interface DocumentTypeRepository extends GenericRepository<DocumentType> {
  getDocumentTypeByName(name: DocumentTypeName): Promise<DocumentType>;
}
