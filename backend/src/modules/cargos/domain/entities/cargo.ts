import { GenericEntity } from '@shared/entities/generic-entity';
import { DataString } from '@shared/value-objects/data-string';
import type { Metadata } from '@shared/types/metadata';

export interface UpdateCargoData {
  name?: string;
  description?: string;
  areaId?: string | null;
  active?: boolean;
}

export interface CargoWithCount {
  cargo: Cargo;
  empleadosCount: number;
}

export class Cargo extends GenericEntity {
  constructor(
    private _name: DataString,
    private _description: string = '',
    private _areaId: string | null = null,
    private _areaName: string | null = null,
    private _active: boolean = true,
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

  get areaId(): string | null {
    return this._areaId;
  }

  get areaName(): string | null {
    return this._areaName;
  }

  get active(): boolean {
    return this._active;
  }

  updateData(updateData: UpdateCargoData) {
    this._name = updateData.name
      ? DataString.create(updateData.name)
      : this.name;
    this._description = updateData.description ?? this.description;
    if (updateData.areaId !== undefined) {
      this._areaId = updateData.areaId;
    }
    if (updateData.active !== undefined) {
      this._active = updateData.active;
    }

    this.metadata.updatedAt = new Date();
  }
}