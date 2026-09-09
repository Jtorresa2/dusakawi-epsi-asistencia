import { prisma } from '@config/database/prisma/prisma';
import type { Prisma } from '@config/database/prisma/generated/client';
import type { Uuid } from '@shared/types/uuid';
import type { DataString } from '@shared/value-objects/data-string';
import { Role } from '@modules/users/domain/entities/role';
import type { RoleRepository } from '@modules/users/domain/repositories/role-repository';
import { PrismaRoleMapper } from '@modules/users/infrastructure/mappers/prisma/prisma-role.mapper';

export class PrismaRoleRepository implements RoleRepository {
  private async findRoleByUniqueInput(
    where: Prisma.rolesWhereUniqueInput,
  ): Promise<Role | null> {
    const userFound = await prisma.roles.findUnique({ where });
    return userFound ? PrismaRoleMapper.toDomain(userFound) : null;
  }

  async create(entity: Role): Promise<void> {
    await prisma.roles.create({ data: PrismaRoleMapper.toCreate(entity) });
  }

  async update(id: Uuid, entity: Role): Promise<void> {
    await prisma.roles.update({
      where: { id },
      data: PrismaRoleMapper.toUpdate(entity),
    });
  }

  async delete(id: Uuid): Promise<void> {
    await prisma.roles.delete({ where: { id } });
  }

  async findById(id: Uuid): Promise<Role | null> {
    return await this.findRoleByUniqueInput({ id });
  }

  async findAll(): Promise<Role[]> {
    const roles = await prisma.roles.findMany();
    return roles.map((role) => PrismaRoleMapper.toDomain(role));
  }

  async getRoleByName(name: DataString): Promise<Role | null> {
    return await this.findRoleByUniqueInput({ name: name.value });
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
