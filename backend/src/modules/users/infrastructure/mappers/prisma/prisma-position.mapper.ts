import { Prisma } from '@config/database/prisma/generated/client.js';
import { DataString } from '@shared/value-objects/data-string.js';
import { Position } from '../../../domain/entities/position.js';
import type { Uuid } from '@shared/types/uuid.js';
import type { OrmMapper } from '@shared/mappers/orm.mapper.js';

type PrismaPosition = Prisma.positionsGetPayload<{}>;

export class PrismaPositionMapper implements OrmMapper<
  Position,
  PrismaPosition,
  Prisma.positionsCreateInput,
  Prisma.positionsUpdateInput
> {
  toDomain(position: PrismaPosition): Position {
    return new Position(
      DataString.create(position.name),
      DataString.create(position.description),
      {
        id: position.id as Uuid,
        createdAt: position.created_at,
        updatedAt: position.updated_at,
      },
    );
  }

  toCreate(position: Position): Prisma.positionsCreateInput {
    return {
      name: position.name.value,
      description: position.description?.value,
      id: position.metadata!.id,
      created_at: position.metadata!.createdAt,
      updated_at: position.metadata!.updatedAt,
    };
  }

  toUpdate(position: Position): Prisma.positionsUpdateInput {
    return {
      name: position.name.value,
      description: position.description?.value,
      updated_at: position.metadata!.updatedAt,
    };
  }
}
