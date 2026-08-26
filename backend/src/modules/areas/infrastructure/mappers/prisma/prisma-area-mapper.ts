import { DataString } from '@shared/value-objects/data-string.js';
import { Area } from '../../../domain/entities/area.js';
import { Prisma } from '@config/database/prisma/generated/client.js';
import { PrismaFloorMapper } from './prisma-floor.mapper.js';
import type { Uuid } from '@shared/types/uuid.js';

type PrismaArea = Prisma.areasGetPayload<{ include: { floors: true } }>;

export class PrismaAreaMapper {
  static toDomain(likeArea: PrismaArea): Area {
    return new Area(
      PrismaFloorMapper.toDomain(likeArea.floors),
      DataString.create(likeArea.name),
      likeArea.description ? DataString.create(likeArea.description) : null,
      {
        id: likeArea.id as Uuid,
        createdAt: likeArea.created_at,
        updatedAt: likeArea.updated_at,
      },
    );
  }

  static toCreate(area: Area): Prisma.areasCreateInput {
    return {
      name: area.name.value,
      description: area.description?.value ?? null,
      floors: { connect: { id: area.floor.metadata.id } },
      id: area.metadata.id.toString(),
      created_at: area.metadata.createdAt,
      updated_at: area.metadata.updatedAt,
    };
  }

  static toUpdate(area: Area): Prisma.areasUpdateInput {
    return {
      name: area.name.value,
      description: area.description?.value ?? null,
      floors: { connect: { id: area.floor.metadata.id } },
      updated_at: area.metadata.updatedAt,
    };
  }
}
