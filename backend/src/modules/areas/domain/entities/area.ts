import { GenericEntity } from '@shared/entities/generic-entity';
import { DataString } from '@shared/value-objects/data-string';
import { Floor } from './floor';
import type { Metadata } from '@shared/types/metadata';

export class Area extends GenericEntity {
  constructor(
    public readonly floor: Floor,
    public readonly name: DataString,
    public readonly description: DataString | null = null,
    metadata: Metadata | null,
  ) {
    super(metadata);
  }
}
