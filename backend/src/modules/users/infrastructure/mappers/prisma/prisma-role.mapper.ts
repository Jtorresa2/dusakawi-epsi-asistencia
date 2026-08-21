import { Prisma } from '@config/database/prisma/generated/client.js';
import { DataString } from '@shared/value-objects/data-string.js';
import { Role } from '../../../domain/entities/role.js';
import type { Uuid } from '@shared/types/uuid.js';

type PrismaRole = Prisma.rolesGetPayload<{}>;

export class PrismaRoleMapper {
  static toDomain(likeRole: PrismaRole): Role {
    return new Role(
      DataString.create(likeRole.name),
      DataString.create(likeRole.description),
      {
        id: likeRole.id as Uuid,
        createdAt: likeRole.created_at,
        updatedAt: likeRole.updated_at,
      },
    );
  }

  static toCreate(role: Role): Prisma.rolesCreateInput {
    return {
      name: role.name.value,
      description: role.description.value,
      id: role.metadata!.id,
      created_at: role.metadata!.createdAt,
      updated_at: role.metadata!.updatedAt,
    };
  }

  static toUpdate(role: Role): Prisma.rolesUpdateInput {
    return {
      name: role.name.value,
      description: role.description.value,
      updated_at: role.metadata!.updatedAt,
    };
  }
}
