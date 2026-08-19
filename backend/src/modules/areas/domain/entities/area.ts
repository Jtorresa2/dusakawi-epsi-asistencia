import { GenericEntity } from '@shared/entities/generic-entity.js';
import { DataString } from '@shared/value-objects/data-string.js';
import { Floor } from './floor.js';
import type { Metadata } from '@shared/types/metadata.js';

export class Area extends GenericEntity {
  constructor(
    public readonly floor: Floor,
    public readonly name: DataString,
    public readonly description: DataString | null = null,
    public readonly metadata: Metadata | null = null,
  ) {
    super(metadata);
  }
}
