import { Prisma } from '@config/database/prisma/generated/client';
import type { Uuid } from '@shared/types/uuid';
import { PrismaDocumentDetailsMapper } from './prisma-document-details.mapper';
import { PrismaPositionMapper } from '@modules/positions/infrastructure/mappers/prisma/prisma-position.mapper';
import { PrismaAreaMapper } from '@modules/areas/infrastructure/mappers/prisma/prisma-area-mapper';
import { PrismaRoleMapper } from './prisma-role.mapper';
import { UserDatabaseBuilder } from '@modules/users/domain/builders/user-builder/user-database-builder';
import { User } from '@modules/users/domain/entities/user';
import { HashedPassword } from '@modules/users/domain/value-objects/hashed-password';

type PrismaUser = Prisma.usersGetPayload<{
  include: {
    document_details: {
      include: {
        document_types: true;
      };
    };
    positions: true;
    areas: { include: { floors: true } };
    user_roles: {
      include: {
        roles: true;
      };
    };
  };
}>;

export class PrismaUserMapper {
  static toDomain(likeEntity: PrismaUser): User {
    const roles = likeEntity.user_roles.map(({ roles }) => {
      return PrismaRoleMapper.toDomain(roles);
    });

return new UserDatabaseBuilder()
      .documentDetails(
        PrismaDocumentDetailsMapper.toDomain(likeEntity.document_details!),
      )
      .firstName(likeEntity.first_name?.trim() || 'Sin dato')
      .firstSurname(likeEntity.first_surname?.trim() || 'Sin dato')
      .secondSurname(likeEntity.second_surname?.trim() || undefined)
      .dateOfBirth(likeEntity.date_of_birth)
      .placeOfBirth(likeEntity.place_of_birth?.trim() || 'Sin dato')
      .address(likeEntity.address?.trim() || 'Sin dato')
      .phone(likeEntity.phone ?? undefined)
      .cell(likeEntity.phone ?? 'Sin dato')
      .position(PrismaPositionMapper.toDomain(likeEntity.positions))
      .area(PrismaAreaMapper.toDomain(likeEntity.areas))
      .username(likeEntity.username?.trim() || 'Sin dato')
      .passwordHash(HashedPassword.create(likeEntity.password_hash))
      .email(likeEntity.email?.trim() || 'Sin dato')
      .roles(roles)
      .middleName(likeEntity.middle_name?.trim() || undefined)
      .metadata({
        id: likeEntity.id as Uuid,
        createdAt: likeEntity.created_at,
        updatedAt: likeEntity.updated_at,
      })
      .build();
  }

  private static basicData(user: User) {
    return {
      first_name: user.firstName.value,
      middle_name: user.middleName?.value,
      first_surname: user.firstSurname.value,
      second_surname: user.secondSurname?.value,
      date_of_birth: user.dateOfBirth,
      place_of_birth: user.placeOfBirth.value,
      address: user.address.value,
      phone: user.phone?.value ?? user.cell.value,
    };
  }

  static toCreate(entity: User): Prisma.usersCreateInput {
    return {
      ...PrismaUserMapper.basicData(entity),
      email: entity.email.value,
      password_hash: entity.passwordHash.value,
      username: entity.username.value,
      id: entity.metadata.id,
      created_at: entity.metadata.createdAt,
      updated_at: entity.metadata.updatedAt,
      positions: { connect: { id: entity.position.metadata.id } },
      areas: { connect: { id: entity.area.metadata.id } },
      document_details: {
        create: PrismaDocumentDetailsMapper.toCreate(entity.documentDetails),
      },
      user_roles: {
        create: entity.roles.map((role) => ({
          roles: { connect: { id: role.metadata.id } },
        })),
      },
    };
  }

  static toUpdate(entity: User): Prisma.usersUpdateInput {
    return {
      ...PrismaUserMapper.basicData(entity),
      updated_at: entity.metadata.updatedAt,
      positions: { connect: { id: entity.position.metadata.id } },
      areas: { connect: { id: entity.area.metadata.id } },
      document_details: {
        update: PrismaDocumentDetailsMapper.toUpdate(entity.documentDetails),
      },
      user_roles: {
        deleteMany: {},
        create: entity.roles.map((role) => ({
          roles: { connect: { id: role.metadata.id } },
        })),
      },
    };
  }
}
