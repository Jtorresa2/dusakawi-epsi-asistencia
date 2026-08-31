import { Prisma } from '@config/database/prisma/generated/client.js';
import { DataString } from '@shared/value-objects/data-string.js';
import { DocumentDetails } from '../../../domain/value-objects/document-details.js';
import { DocumentNumber } from '../../../domain/value-objects/document-number.js';
import { PrismaDocumentTypeMapper } from './prisma-document-type.mapper.js';

type PrismaDocumentDetails = Prisma.document_detailsGetPayload<{
  include: {
    document_types: true;
  };
}>;

export class PrismaDocumentDetailsMapper {
  static toDomain(likeDocumentDetails: PrismaDocumentDetails): DocumentDetails {
    return DocumentDetails.create(
      PrismaDocumentTypeMapper.toDomain(likeDocumentDetails.document_types),
      DocumentNumber.create(likeDocumentDetails.document_number),
      likeDocumentDetails.issue_date,
      DataString.create(likeDocumentDetails.place_of_issue),
    );
  }

  static toCreate(
    documentDetails: DocumentDetails,
  ): Prisma.document_detailsCreateWithoutUsersInput {
    return {
      document_types: {
        connect: {
          id: documentDetails.documentType.metadata.id,
        },
      },
      document_number: documentDetails.documentNumber.value,
      issue_date: documentDetails.issueDate,
      place_of_issue: documentDetails.placeOfIssue.value,
    };
  }

  static toUpdate(
    documentDetails: DocumentDetails,
  ): Prisma.document_detailsUpdateInput {
    return {
      document_types: {
        connect: {
          id: documentDetails.documentType.metadata.id,
        },
      },
      document_number: documentDetails.documentNumber.value,
      issue_date: documentDetails.issueDate,
      place_of_issue: documentDetails.placeOfIssue.value,
    };
  }
}
