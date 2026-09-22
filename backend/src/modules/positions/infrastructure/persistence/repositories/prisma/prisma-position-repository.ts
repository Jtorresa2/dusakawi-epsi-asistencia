import type { Prisma } from '@config/database/prisma/generated/client';
import { prisma } from '@config/database/prisma/prisma';
import { asCrudDelegate } from '@config/database/prisma/delegate';
import { PrismaGenericRepository } from '@shared/repositories/prisma/prisma-generic-repository';
import type { DataString } from '@shared/value-objects/data-string';
import type { PositionRepository } from '@modules/positions/domain/repositories/position-repository';
import type { Position } from '@modules/positions/domain/entities/position';
import { PrismaPositionMapper } from '@modules/positions/infrastructure/mappers/prisma/prisma-position.mapper';

export class PrismaPositionRepository
  extends PrismaGenericRepository<
    Position,
    Prisma.positionsGetPayload<{}>,
    Prisma.positionsWhereInput,
    Prisma.positionsWhereUniqueInput,
    Prisma.positionsCreateInput,
    Prisma.positionsUpdateInput
  >
  implements PositionRepository
{
  constructor() {
    super(asCrudDelegate(prisma.positions), PrismaPositionMapper);
  }

  protected buildSearchWhere(query: string): Prisma.positionsWhereInput {
    return {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ],
    };
  }

  async getPositionByName(name: DataString): Promise<Position | null> {
    const position = await prisma.positions.findUnique({
      where: { name: name.value },
    });

    return position ? PrismaPositionMapper.toDomain(position) : null;
  }

  async getPositionByDescription(
    description: DataString,
  ): Promise<Position | null> {
    const position = await prisma.positions.findFirst({
      where: { description: description.value },
    });

    return position ? PrismaPositionMapper.toDomain(position) : null;
  }
}
