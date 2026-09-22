import type { Uuid } from '@shared/types/uuid';
import type { BasicData } from '@modules/users/domain/entities/user';
import type { DocumentDetailsDto } from '../../common/dtos/document-details.dto';

export interface UpdateBasicDataCommandDto extends Omit<
  BasicData,
  'documentDetails'
> {
  id: Uuid;
  documentDetails: DocumentDetailsDto;
}
