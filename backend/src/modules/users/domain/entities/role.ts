import { GenericEntity } from '@shared/entities/generic-entity.js';
import { DataString } from '@shared/value-objects/data-string.js';

export class Role extends GenericEntity {
  constructor(
    public readonly name: DataString,
    public readonly description: DataString,
  ) {
    super();
  }
}
