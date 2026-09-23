import { Prisma } from '@config/database/prisma/generated/client';
import type { Uuid } from '@shared/types/uuid';
import { DataString } from '@shared/value-objects/data-string';
import { Cargo } from '@modules/cargos/domain/entities/cargo';

type PrismaCargo = Prisma.positionsGetPayload<{}>;

export class PrismaCargoMapper {
  static toDomain(position: PrismaCargo): Cargo {
    return new Cargo(
      DataString.create(position.name),
      position.description,
      {
        id: position.id as Uuid,
        createdAt: position.created_at,
        updatedAt: position.updated_at,
      },
    );
  }

  static toCreate(cargo: Cargo): Prisma.positionsCreateInput {
    return {
      name: cargo.name.value,
      description: cargo.description,
      created_at: cargo.metadata.createdAt,
      updated_at: cargo.metadata.updatedAt,
    };
  }

  static toUpdate(cargo: Cargo): Prisma.positionsUpdateInput {
    return {
      name: cargo.name.value,
      description: cargo.description,
      updated_at: cargo.metadata.updatedAt,
    };
  }
}