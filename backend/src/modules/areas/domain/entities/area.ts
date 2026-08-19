import { GenericEntity } from '@shared/entities/generic-entity.js';
import { DataString } from '@shared/value-objects/data-string.js';
import { Floor } from './floor.js';

export class Area extends GenericEntity {
  constructor(
    public readonly floor: Floor,
    public readonly name: DataString,
    public readonly description: DataString | null = null,
  ) {
    super();
  }
}
