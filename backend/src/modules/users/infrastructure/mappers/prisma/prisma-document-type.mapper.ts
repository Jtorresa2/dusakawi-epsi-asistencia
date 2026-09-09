import { Prisma } from '@config/database/prisma/generated/client';
import type { Uuid } from '@shared/types/uuid';
import {
  DocumentType,
  DocumentTypeName,
} from '@modules/users/domain/entities/document-type';

type PrismaDocumentType = Prisma.document_typesGetPayload<{}>;

export class PrismaDocumentTypeMapper {
  static toDomain(likeDocumentType: PrismaDocumentType): DocumentType {
    return new DocumentType(likeDocumentType.name as DocumentTypeName, {
      id: likeDocumentType.id as Uuid,
      createdAt: likeDocumentType.created_at,
      updatedAt: likeDocumentType.updated_at,
    });
  }

  static toCreate(
    documentType: DocumentType,
  ): Prisma.document_typesCreateInput {
    return {
      name: documentType.name,
      id: documentType.metadata.id,
      created_at: documentType.metadata.createdAt,
      updated_at: documentType.metadata.updatedAt,
    };
  }

  static toUpdate(
    documentType: DocumentType,
  ): Prisma.document_typesUpdateInput {
    return {
      name: documentType.name,
      updated_at: documentType.metadata.updatedAt,
    };
  }
}
