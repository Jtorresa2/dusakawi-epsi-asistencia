import { GenericEntity } from '@shared/entities/generic-entity';
import { DataString } from '@shared/value-objects/data-string';
import type { Metadata } from '@shared/types/metadata';

export interface UpdateCargoData {
  name?: string;
  description?: string;
}

export interface CargoWithCount {
  cargo: Cargo;
  empleadosCount: number;
}

export class Cargo extends GenericEntity {
  constructor(
    private _name: DataString,
    private _description: string = '',
    metadata?: Metadata | null,
  ) {
    super(metadata);
  }

  get name(): DataString {
    return this._name;
  }

  get description(): string {
    return this._description;
  }

  updateData(updateData: UpdateCargoData) {
    this._name = updateData.name
      ? DataString.create(updateData.name)
      : this.name;
    this._description = updateData.description ?? this.description;

    this.metadata.updatedAt = new Date();
  }
}