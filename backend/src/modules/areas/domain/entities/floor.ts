import { GenericEntity } from '@shared/entities/generic-entity.js';
import { DataString } from '@shared/value-objects/data-string.js';

export class Floor extends GenericEntity {
  constructor(public readonly name: DataString) {
    super();
  }
}
