import type { Uuid } from '@shared/types/uuid.js';
import type { User } from '../../../../domain/entities/user.js';
import type { UserRepository } from '../../../../domain/repositories/user-repository.js';
import { prisma } from '@config/database/prisma/prisma.js';
import { PrismaUserMapper } from '../../../mappers/prisma/prisma-user.mapper.js';
import type { Prisma } from '@config/database/prisma/generated/client.js';

export class PrismaUserRepository implements UserRepository {
  private readonly includeEntities = {
    positions: true,
    area: { include: { floors: true } },
    document_details: { include: { document_types: true } },
    user_roles: { include: { roles: true } },
  };

  private async findUserByUniqueInput(
    where: Prisma.usersWhereUniqueInput,
  ): Promise<User | null> {
    const userFound = await prisma.users.findUnique({
      where,
      include: this.includeEntities,
    });

    return userFound ? PrismaUserMapper.toDomain(userFound) : null;
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

  async findAll(): Promise<User[]> {
    const users = await prisma.users.findMany({
      include: this.includeEntities,
    });

    return users.map((user) => PrismaUserMapper.toDomain(user));
  }

  async getUserByUsername(username: string): Promise<User | null> {
    return await this.findUserByUniqueInput({ username });
  }

  async getUserExists(username: string): Promise<boolean> {
    const userExist = await prisma.users.count({ where: { username } });
    return userExist !== 0;
  }

  async getUserExistsByDocument(documentNumber: string): Promise<boolean> {
    const userExist = await prisma.users.count({
      where: {
        document_details: {
          document_number: documentNumber,
        },
      },
    });

    return userExist !== 0;
  }
}
