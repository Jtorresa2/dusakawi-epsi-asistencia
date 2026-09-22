import type { GenericRepository } from '@shared/repositories/generic-repository';
import { DocumentType, DocumentTypeName } from '../entities/document-type';

export interface DocumentTypeRepository extends GenericRepository<DocumentType> {
  getDocumentTypeByName(name: DocumentTypeName): Promise<DocumentType | null>;
}
