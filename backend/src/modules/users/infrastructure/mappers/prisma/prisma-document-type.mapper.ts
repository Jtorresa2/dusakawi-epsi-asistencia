import { Prisma } from '@config/database/prisma/generated/client.js';
import {
  DocumentType,
  DocumentTypeName,
} from '../../../domain/entities/document-type.js';
import type { Uuid } from '@shared/types/uuid.js';
import type { OrmMapper } from '@shared/mappers/orm.mapper.js';

type PrismaDocumentType = Prisma.document_typesGetPayload<{}>;

export class PrismaDocumentTypeMapper implements OrmMapper<
  DocumentType,
  PrismaDocumentType,
  Prisma.document_typesCreateInput,
  Prisma.document_typesUpdateInput
> {
  toDomain(likeDocumentType: PrismaDocumentType): DocumentType {
    return new DocumentType(likeDocumentType.name as DocumentTypeName, {
      id: likeDocumentType.id as Uuid,
      createdAt: likeDocumentType.created_at,
      updatedAt: likeDocumentType.updated_at,
    });
  }

  toCreate(documentType: DocumentType): Prisma.document_typesCreateInput {
    return {
      name: documentType.name,
      id: documentType.metadata!.id,
      created_at: documentType.metadata!.createdAt,
      updated_at: documentType.metadata!.updatedAt,
    };
  }

  toUpdate(documentType: DocumentType): Prisma.document_typesUpdateInput {
    return {
      name: documentType.name,
      updated_at: documentType.metadata!.updatedAt,
    };
  }
}
