import type { Uuid } from '@shared/types/uuid.js';
import type {
  DocumentTypeName,
  DocumentType,
} from '../../../../domain/entities/document-type.js';
import type { DocumentTypeRepository } from '../../../../domain/repositories/document-type-repository.js';
import { prisma } from '@config/database/prisma/prisma.js';
import { PrismaDocumentTypeMapper } from '../../../mappers/prisma/prisma-document-type.mapper.js';
import type { Prisma } from '@config/database/prisma/generated/client.js';

export class PrismaDocumentTypeRepository implements DocumentTypeRepository {
  private async findDocumentTypeByUniqueInput(
    where: Prisma.document_typesWhereUniqueInput,
  ): Promise<DocumentType | null> {
    const documentTypeFound = await prisma.document_types.findUnique({ where });
    return documentTypeFound
      ? PrismaDocumentTypeMapper.toDomain(documentTypeFound)
      : null;
  }

  async getDocumentTypeByName(
    name: DocumentTypeName,
  ): Promise<DocumentType | null> {
    return await this.findDocumentTypeByUniqueInput({ name });
  }

  async create(entity: DocumentType): Promise<void> {
    await prisma.document_types.create({
      data: PrismaDocumentTypeMapper.toCreate(entity),
    });
  }

  async update(id: Uuid, entity: DocumentType): Promise<void> {
    await prisma.document_types.update({
      where: { id },
      data: PrismaDocumentTypeMapper.toUpdate(entity),
    });
  }

  async delete(id: Uuid): Promise<void> {
    await prisma.document_types.delete({ where: { id } });
  }

  async findById(id: Uuid): Promise<DocumentType | null> {
    return await this.findDocumentTypeByUniqueInput({ id });
  }

  async findAll(): Promise<DocumentType[]> {
    const documentTypes = await prisma.document_types.findMany();
    return documentTypes.map((documentType) =>
      PrismaDocumentTypeMapper.toDomain(documentType),
    );
  }
}
