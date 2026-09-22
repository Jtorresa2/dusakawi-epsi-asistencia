import { prisma } from '@config/database/prisma/prisma';
import type { Prisma } from '@config/database/prisma/generated/client';
import { asCrudDelegate } from '@config/database/prisma/delegate';
import { PrismaGenericRepository } from '@shared/repositories/prisma/prisma-generic-repository';
import { User } from '@modules/users/domain/entities/user';
import type { UserRepository } from '@modules/users/domain/repositories/user-repository';
import { PrismaUserMapper } from '@modules/users/infrastructure/mappers/prisma/prisma-user.mapper';

const includeEntities = {
  positions: true,
  area: { include: { floors: true } },
  document_details: { include: { document_types: true } },
  user_roles: { include: { roles: true } },
} as const;

export class PrismaUserRepository
  extends PrismaGenericRepository<
    User,
    Prisma.usersGetPayload<{ include: typeof includeEntities }>,
    Prisma.usersWhereInput,
    Prisma.usersWhereUniqueInput,
    Prisma.usersCreateInput,
    Prisma.usersUpdateInput,
    typeof includeEntities
  >
  implements UserRepository
{
  private readonly queryFields = [
    'first_name',
    'middle_name',
    'first_surname',
    'second_surname',
    'username',
    'email',
  ];

  constructor() {
    super(asCrudDelegate(prisma.users), PrismaUserMapper, includeEntities);
  }

  protected buildSearchWhere(query: string): Prisma.usersWhereInput {
    const where: Prisma.usersWhereInput = {
      OR: this.queryFields.map((field) => ({
        [field]: { contains: query, mode: 'insensitive' },
      })),
    };
    return where;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const found = await prisma.users.findUnique({
      where: { username },
      include: includeEntities,
    });

    return found ? this.mapper.toDomain(found) : null;
  }

  async getUserExists(username: string): Promise<boolean> {
    return (await prisma.users.count({ where: { username } })) !== 0;
  }

  async getUserExistsByDocument(documentNumber: string): Promise<boolean> {
    return (
      (await prisma.users.count({
        where: { document_details: { document_number: documentNumber } },
      })) !== 0
    );
  }

  async getUserExistsByEmail(email: string): Promise<boolean> {
    return (await prisma.users.count({ where: { email } })) !== 0;
  }
}
