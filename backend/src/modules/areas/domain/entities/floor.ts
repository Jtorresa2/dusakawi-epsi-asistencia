import { GenericEntity } from '@shared/entities/generic-entity';
import type { Metadata } from '@shared/types/metadata';
import { DataString } from '@shared/value-objects/data-string';

export interface UpdateFloorData {
  name?: string;
}

export class Floor extends GenericEntity {
  constructor(
    private _name: DataString,
    metadata?: Metadata | null,
  ) {
    super(metadata);
  }

  public get name(): DataString {
    return this._name;
  }

  updateData(updateData: UpdateFloorData) {
    this._name = updateData.name
      ? DataString.create(updateData.name)
      : this.name;

    this.metadata.updatedAt = new Date();
  }
}
