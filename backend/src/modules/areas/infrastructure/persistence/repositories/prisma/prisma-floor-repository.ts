import { asCrudDelegate } from '@config/database/prisma/delegate';
import type { Prisma } from '@config/database/prisma/generated/client';
import { prisma } from '@config/database/prisma/prisma';
import type { Floor } from '@modules/areas/domain/entities/floor';
import type { FloorRepository } from '@modules/areas/domain/repositories/floor-repository';
import { PrismaFloorMapper } from '@modules/areas/infrastructure/mappers/prisma/prisma-floor.mapper';
import { PrismaGenericRepository } from '@shared/repositories/prisma/prisma-generic-repository';

export class PrismaFloorRepository
  extends PrismaGenericRepository<
    Floor,
    Prisma.floorsGetPayload<{}>,
    Prisma.floorsWhereInput,
    Prisma.floorsWhereUniqueInput,
    Prisma.floorsCreateInput,
    Prisma.floorsUpdateInput
  >
  implements FloorRepository
{
  constructor() {
    super(asCrudDelegate(prisma.floors), PrismaFloorMapper);
  }

  protected buildSearchWhere(query: string): Prisma.floorsWhereInput {
    return query ? { name: { contains: query, mode: 'insensitive' } } : {};
  }
}
