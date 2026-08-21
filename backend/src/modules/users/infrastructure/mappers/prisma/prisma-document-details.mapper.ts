import { Prisma } from '@config/database/prisma/generated/client.js';
import { DataString } from '@shared/value-objects/data-string.js';
import { DocumentDetails } from '../../../domain/value-objects/document-details.js';
import { DocumentNumber } from '../../../domain/value-objects/document-number.js';
import { PrismaDocumentTypeMapper } from './prisma-document-type.mapper.js';
import type { OrmMapper } from '@shared/mappers/orm.mapper.js';

type PrismaDocumentDetails = Prisma.document_detailsGetPayload<{
  include: {
    document_types: true;
  };
}>;

export class PrismaDocumentDetailsMapper implements OrmMapper<
  DocumentDetails,
  PrismaDocumentDetails,
  Prisma.document_detailsCreateInput,
  Prisma.document_detailsUpdateInput
> {
  constructor(private readonly documentTypeMapper: PrismaDocumentTypeMapper) {}

  toDomain(likeDocumentDetails: PrismaDocumentDetails): DocumentDetails {
    return DocumentDetails.create(
      this.documentTypeMapper.toDomain(likeDocumentDetails.document_types),
      DocumentNumber.create(likeDocumentDetails.document_number),
      likeDocumentDetails.issue_date,
      DataString.create(likeDocumentDetails.place_of_issue),
    );
  }

  toCreate(
    documentDetails: DocumentDetails,
  ): Prisma.document_detailsCreateInput {
    return {
      document_types: {
        connect: {
          id: documentDetails.documentType.metadata!.id,
        },
      },
      document_number: documentDetails.documentNumber.value,
      issue_date: documentDetails.issueDate,
      place_of_issue: documentDetails.placeOfIssue.value,
    };
  }

  toUpdate(
    documentDetails: DocumentDetails,
  ): Prisma.document_detailsUpdateInput {
    return {
      document_types: {
        connect: {
          id: documentDetails.documentType.metadata!.id,
        },
      },
      document_number: documentDetails.documentNumber.value,
      issue_date: documentDetails.issueDate,
      place_of_issue: documentDetails.placeOfIssue.value,
    };
  }
}
