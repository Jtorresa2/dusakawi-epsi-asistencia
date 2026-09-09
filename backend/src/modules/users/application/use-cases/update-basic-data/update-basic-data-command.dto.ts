import type { Uuid } from '@shared/types/uuid.js';
import type { BasicData } from '../../../domain/entities/user.js';
import type { DocumentDetailsDto } from '../../common/dtos/document-details.dto.js';

export interface UpdateBasicDataCommandDto extends Omit<
  BasicData,
  'documentDetails'
> {
  id: Uuid;
  documentDetails: DocumentDetailsDto;
}
