import { GenericEntity } from '@shared/entities/generic-entity.js';
import type { Metadata } from '@shared/types/metadata.js';
import { DataString } from '@shared/value-objects/data-string.js';

export class Position extends GenericEntity {
  constructor(
    public readonly name: DataString,
    public readonly description: DataString,
    public readonly metadata: Metadata | null = null,
  ) {
    super(metadata);
  }
}
