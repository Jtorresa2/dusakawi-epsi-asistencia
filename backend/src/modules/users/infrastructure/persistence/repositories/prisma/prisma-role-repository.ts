import type { Prisma } from '@config/database/prisma/generated/client';
import { prisma } from '@config/database/prisma/prisma';
import { asCrudDelegate } from '@config/database/prisma/delegate';
import { PrismaGenericRepository } from '@shared/repositories/prisma/prisma-generic-repository';
import { Role } from '@modules/users/domain/entities/role';
import type { DataString } from '@shared/value-objects/data-string';
import type { RoleRepository } from '@modules/users/domain/repositories/role-repository';
import { PrismaRoleMapper } from '@modules/users/infrastructure/mappers/prisma/prisma-role.mapper';

export class PrismaRoleRepository
  extends PrismaGenericRepository<
    Role,
    Prisma.rolesGetPayload<{}>,
    Prisma.rolesWhereInput,
    Prisma.rolesWhereUniqueInput,
    Prisma.rolesCreateInput,
    Prisma.rolesUpdateInput
  >
  implements RoleRepository
{
  constructor() {
    super(asCrudDelegate(prisma.roles), PrismaRoleMapper);
  }

  protected buildSearchWhere(query: string): Prisma.rolesWhereInput {
    return {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ],
    };
  }

  async getRoleByName(name: DataString): Promise<Role | null> {
    const role = await prisma.roles.findUnique({
      where: { name: name.value },
    });

    return role ? PrismaRoleMapper.toDomain(role) : null;
  }

  async getRoleByDescription(description: DataString): Promise<Role | null> {
    const role = await prisma.roles.findFirst({
      where: { description: description.value },
    });

    return role ? PrismaRoleMapper.toDomain(role) : null;
  }

  async getRolesByName(names: string[]): Promise<Role[]> {
    const roles = await prisma.roles.findMany({
      where: { name: { in: names } },
    });

    return roles.map((role) => PrismaRoleMapper.toDomain(role));
  }
}
