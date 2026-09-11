import { GenericEntity } from '@shared/entities/generic-entity';
import { DataString } from '@shared/value-objects/data-string';
import { Floor } from './floor';
import type { Metadata } from '@shared/types/metadata';

export interface UpdateAreaData {
  floor?: Floor;
  name?: string;
  description?: string | null;
}

export class Area extends GenericEntity {
  constructor(
    private _floor: Floor,
    private _name: DataString,
    private _description: DataString | null = null,
    metadata?: Metadata | null,
  ) {
    super(metadata);
  }

  public get floor(): Floor {
    return this._floor;
  }

  public get name(): DataString {
    return this._name;
  }

  public get description(): DataString | null {
    return this._description;
  }

  updateData(updateData: UpdateAreaData) {
    this._floor = updateData.floor ?? this.floor;
    this._name = updateData.name
      ? DataString.create(updateData.name)
      : this.name;
    this._description = updateData.description
      ? DataString.create(updateData.description)
      : this.description;

    this.metadata.updatedAt = new Date();
  }
}
