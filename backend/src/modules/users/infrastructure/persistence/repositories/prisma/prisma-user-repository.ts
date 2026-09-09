import type { Uuid } from '@shared/types/uuid';
import { prisma } from '@config/database/prisma/prisma';
import type { Prisma } from '@config/database/prisma/generated/client';
import type { PagedListResponse } from '@shared/types/paged-list-response';
import type { FindAllOptions } from '@shared/repositories/generic-repository';
import { User } from '@modules/users/domain/entities/user';
import type { UserRepository } from '@modules/users/domain/repositories/user-repository';
import { PrismaUserMapper } from '@modules/users/infrastructure/mappers/prisma/prisma-user.mapper';

export class PrismaUserRepository implements UserRepository {
  private readonly includeEntities = {
    positions: true,
    area: { include: { floors: true } },
    document_details: { include: { document_types: true } },
    user_roles: { include: { roles: true } },
  };

  private readonly queryFields = [
    'first_name',
    'middle_name',
    'first_surname',
    'second_surname',
    'username',
    'email',
  ];

  private async findUserByUniqueInput(
    where: Prisma.usersWhereUniqueInput,
  ): Promise<User | null> {
    const userFound = await prisma.users.findUnique({
      where,
      include: this.includeEntities,
    });

    return userFound ? PrismaUserMapper.toDomain(userFound) : null;
  }

  private async getIfUserExists(
    where: Prisma.usersWhereInput,
  ): Promise<boolean> {
    const userExist = await prisma.users.count({ where });
    return userExist !== 0;
  }

  async create(entity: User): Promise<void> {
    await prisma.users.create({
      data: PrismaUserMapper.toCreate(entity),
    });
  }

  async update(id: Uuid, entity: User): Promise<void> {
    await prisma.users.update({
      where: { id },
      data: PrismaUserMapper.toUpdate(entity),
    });
  }

  async delete(id: Uuid): Promise<void> {
    await prisma.users.delete({ where: { id } });
  }

  async findById(id: Uuid): Promise<User | null> {
    return await this.findUserByUniqueInput({ id });
  }

  async findAll(options?: FindAllOptions): Promise<PagedListResponse<User>> {
    const { page = 1, limit = 10, query } = options || {};

    const where: Prisma.usersWhereInput = query
      ? {
          OR: this.queryFields.map((field) => ({
            [field]: { contains: query, mode: 'insensitive' },
          })),
        }
      : {};

    const [total, users] = await prisma.$transaction([
      prisma.users.count({ where }),
      prisma.users.findMany({
        include: this.includeEntities,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { created_at: 'desc' },
        where,
      }),
    ]);

    return {
      total,
      items: users.map((user) => PrismaUserMapper.toDomain(user)),
    };
  }

  async getUserByUsername(username: string): Promise<User | null> {
    return await this.findUserByUniqueInput({ username });
  }

  async getUserExists(username: string): Promise<boolean> {
    return await this.getIfUserExists({ username });
  }

  async getUserExistsByDocument(documentNumber: string): Promise<boolean> {
    return await this.getIfUserExists({
      document_details: { document_number: documentNumber },
    });
  }

  async getUserExistsByEmail(email: string): Promise<boolean> {
    return await this.getIfUserExists({ email });
  }
}
