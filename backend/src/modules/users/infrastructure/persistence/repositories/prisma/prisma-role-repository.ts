import { prisma } from '@config/database/prisma/prisma.js';
import type { Uuid } from '@shared/types/uuid.js';
import type { DataString } from '@shared/value-objects/data-string.js';
import type { Role } from '../../../../domain/entities/role.js';
import type { RoleRepository } from '../../../../domain/repositories/role-repository.js';
import type { PrismaRoleMapper } from '../../../mappers/prisma/prisma-role.mapper.js';
import type { Prisma } from '@config/database/prisma/generated/client.js';

export class PrismaRoleRepository implements RoleRepository {
  constructor(private readonly roleMapper: PrismaRoleMapper) {}

  private async findRoleByUniqueInput(
    where: Prisma.rolesWhereUniqueInput,
  ): Promise<Role | null> {
    const userFound = await prisma.roles.findUnique({ where });
    return userFound ? this.roleMapper.toDomain(userFound) : null;
  }

  async create(entity: Role): Promise<void> {
    await prisma.roles.create({ data: this.roleMapper.toCreate(entity) });
  }

  async update(id: Uuid, entity: Role): Promise<void> {
    await prisma.roles.update({
      where: { id },
      data: this.roleMapper.toUpdate(entity),
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
    return roles.map((role) => this.roleMapper.toDomain(role));
  }

  async getRoleByName(name: DataString): Promise<Role | null> {
    return await this.findRoleByUniqueInput({ name: name.value });
  }

  async getRoleByDescription(description: DataString): Promise<Role | null> {
    const role = await prisma.roles.findFirst({
      where: { description: description.value },
    });

    return role ? this.roleMapper.toDomain(role) : null;
  }

  async getRolesByName(names: string[]): Promise<Role[]> {
    const roles = await prisma.roles.findMany({
      where: { name: { in: names } },
    });

    return roles.map((role) => this.roleMapper.toDomain(role));
  }
}
