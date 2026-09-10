import { prisma } from '@config/database/prisma/prisma';
import { asCrudDelegate } from '@config/database/prisma/delegate';
import type { Prisma } from '@config/database/prisma/generated/client';
import type {
  DocumentTypeName,
  DocumentType,
} from '@modules/document-types/domain/entities/document-type';
import type { DocumentTypeRepository } from '@modules/document-types/domain/repositories/document-type-repository';
import { PrismaDocumentTypeMapper } from '@modules/document-types/infrastructure/mappers/prisma/prisma-document-type.mapper';
import { PrismaGenericRepository } from '@shared/repositories/prisma/prisma-generic-repository';

export class PrismaDocumentTypeRepository
  extends PrismaGenericRepository<
    DocumentType,
    Prisma.document_typesGetPayload<{}>,
    Prisma.document_typesWhereInput,
    Prisma.document_typesWhereUniqueInput,
    Prisma.document_typesCreateInput,
    Prisma.document_detailsUpdateInput
  >
  implements DocumentTypeRepository
{
  constructor() {
    super(asCrudDelegate(prisma.document_types), PrismaDocumentTypeMapper);
  }

  protected buildSearchWhere(query: string): Prisma.document_typesWhereInput {
    return query ? { name: { contains: query, mode: 'insensitive' } } : {};
  }

  async getDocumentTypeByName(
    name: DocumentTypeName,
  ): Promise<DocumentType | null> {
    const documentTypeFound = await prisma.document_types.findUnique({
      where: { name },
    });

    return documentTypeFound
      ? PrismaDocumentTypeMapper.toDomain(documentTypeFound)
      : null;
  }
}
