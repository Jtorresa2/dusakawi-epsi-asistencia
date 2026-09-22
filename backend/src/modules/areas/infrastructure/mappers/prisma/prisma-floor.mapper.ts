import { Prisma } from '@config/database/prisma/generated/client';
import type { Uuid } from '@shared/types/uuid';
import { DataString } from '@shared/value-objects/data-string';
import { Floor } from '@modules/areas/domain/entities/floor';

type PrismaFloor = Prisma.floorsGetPayload<{}>;

export class PrismaFloorMapper {
  static toDomain(likeFloor: PrismaFloor): Floor {
    return new Floor(DataString.create(likeFloor.name), {
      id: likeFloor.id as Uuid,
      createdAt: likeFloor.created_at,
      updatedAt: likeFloor.updated_at,
    });
  }

  static toCreate(floor: Floor): Prisma.floorsCreateInput {
    return {
      name: floor.name.value,
      id: floor.metadata.id,
      created_at: floor.metadata.createdAt,
      updated_at: floor.metadata.updatedAt,
    };
  }

  static toUpdate(floor: Floor): Prisma.floorsUpdateInput {
    return {
      name: floor.name.value,
      updated_at: floor.metadata.updatedAt,
    };
  }
}
