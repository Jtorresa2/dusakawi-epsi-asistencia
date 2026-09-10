import { prisma } from '@config/database/prisma/prisma';
import { Prisma } from '@config/database/prisma/generated/client';
import { PrismaGenericRepository } from '@shared/repositories/prisma/prisma-generic-repository';
import type { Area } from '@modules/areas/domain/entities/area';
import type { AreaRepository } from '@modules/areas/domain/repositories/area-repository';
import { PrismaAreaMapper } from '@modules/areas/infrastructure/mappers/prisma/prisma-area-mapper';
import { asCrudDelegate } from '@config/database/prisma/delegate';

const includeEntities = { floors: true } as const;

export class PrismaAreaRepository
  extends PrismaGenericRepository<
    Area,
    Prisma.areasGetPayload<{ include: typeof includeEntities }>,
    Prisma.areasWhereInput,
    Prisma.areasWhereUniqueInput,
    Prisma.areasCreateInput,
    Prisma.areasUpdateInput,
    typeof includeEntities
  >
  implements AreaRepository
{
  constructor() {
    super(asCrudDelegate(prisma.areas), PrismaAreaMapper, includeEntities);
  }

  protected buildSearchWhere(query: string): Prisma.areasWhereInput {
    return {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ],
    };
  }
}
