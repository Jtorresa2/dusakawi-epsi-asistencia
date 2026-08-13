import { Uuid } from '@shared/types/uuid.js';

export abstract class GenericEntity {
  public readonly id: Uuid = crypto.randomUUID();
  public readonly createdAt: Date = new Date();
  public readonly updatedAt?: Date;
}
