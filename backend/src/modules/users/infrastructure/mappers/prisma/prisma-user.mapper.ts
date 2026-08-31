import { Prisma } from '@config/database/prisma/generated/client.js';
import { User } from '../../../domain/entities/user.js';
import type { Uuid } from '@shared/types/uuid.js';
import { PrismaDocumentDetailsMapper } from './prisma-document-details.mapper.js';
import { PrismaPositionMapper } from './prisma-position.mapper.js';
import { HashedPassword } from '../../../domain/value-objects/hashed-password.js';
import { PrismaAreaMapper } from '../../../../areas/infrastructure/mappers/prisma/prisma-area-mapper.js';
import { PrismaRoleMapper } from './prisma-role.mapper.js';
import { UserDatabaseBuilder } from '../../../domain/builders/user-builder/user-database-builder.js';

type PrismaUser = Prisma.usersGetPayload<{
  include: {
    document_details: {
      include: {
        document_types: true;
      };
    };
    positions: true;
    area: { include: { floors: true } };
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
      .firstName(likeEntity.first_name)
      .firstSurname(likeEntity.first_surname)
      .secondSurname(likeEntity.second_surname ?? undefined)
      .dateOfBirth(likeEntity.date_of_birth)
      .placeOfBirth(likeEntity.place_of_birth)
      .address(likeEntity.address)
      .cell(likeEntity.cell)
      .position(PrismaPositionMapper.toDomain(likeEntity.positions))
      .area(PrismaAreaMapper.toDomain(likeEntity.area))
      .username(likeEntity.username)
      .passwordHash(HashedPassword.create(likeEntity.password_hash))
      .email(likeEntity.email)
      .roles(roles)
      .middleName(likeEntity.middle_name ?? undefined)
      .phone(likeEntity.phone ?? undefined)
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
      cell: user.cell.value,
      phone: user.phone?.value,
    };
  }

  static toCreate(entity: User): Prisma.usersCreateInput {
    return {
      ...PrismaUserMapper.basicData(entity),
      email: entity.email.value,
      password_hash: entity.password.value,
      username: entity.username.value,
      id: entity.metadata.id,
      created_at: entity.metadata.createdAt,
      updated_at: entity.metadata.updatedAt,
      positions: { connect: { id: entity.position.metadata.id } },
      area: { connect: { id: entity.area.metadata.id } },
      document_details: {
        create: PrismaDocumentDetailsMapper.toCreate(entity.documentDetails),
      },
      user_roles: {
        create: entity.roles.map((role) => {
          return {
            roles: { connect: { id: role.metadata.id } },
          };
        }),
      },
    };
  }

  static toUpdate(entity: User): Prisma.usersUpdateInput {
    return {
      ...PrismaUserMapper.basicData(entity),
      updated_at: entity.metadata.updatedAt,
      positions: { connect: { id: entity.position.metadata.id } },
      area: { connect: { id: entity.area.metadata.id } },
      document_details: {
        update: PrismaDocumentDetailsMapper.toUpdate(entity.documentDetails),
      },
    };
  }
}
