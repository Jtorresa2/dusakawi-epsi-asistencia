import { Prisma } from '@config/database/prisma/generated/client';
import type { Uuid } from '@shared/types/uuid';
import { DataString } from '@shared/value-objects/data-string';
import { Cargo } from '@modules/cargos/domain/entities/cargo';

type PrismaCargo = Prisma.positionsGetPayload<{
  include: { areas: true };
}>;

export class PrismaCargoMapper {
  static toDomain(position: PrismaCargo): Cargo {
    return new Cargo(
      DataString.create(position.name),
      position.description,
      position.area_id ?? null,
      position.areas?.name ?? null,
      position.active,
      {
        id: position.id as Uuid,
        createdAt: position.created_at,
        updatedAt: position.updated_at,
      },
    );
  }

  static toCreate(cargo: Cargo): Prisma.positionsUncheckedCreateInput {
    return {
      name: cargo.name.value,
      description: cargo.description,
      active: cargo.active,
      area_id: cargo.areaId ?? null,
      created_at: cargo.metadata.createdAt,
      updated_at: cargo.metadata.updatedAt,
    };
  }

  static toUpdate(cargo: Cargo): Prisma.positionsUncheckedUpdateInput {
    return {
      name: cargo.name.value,
      description: cargo.description,
      active: cargo.active,
      area_id: cargo.areaId ?? null,
      updated_at: cargo.metadata.updatedAt,
    };
  }
}