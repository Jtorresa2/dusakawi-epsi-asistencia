import { GenericEntity } from '@shared/entities/generic-entity';
import type { Metadata } from '@shared/types/metadata';
import { DataString } from '@shared/value-objects/data-string';

export class Floor extends GenericEntity {
  constructor(
    public readonly name: DataString,
    metadata: Metadata | null,
  ) {
    super(metadata);
  }
}
