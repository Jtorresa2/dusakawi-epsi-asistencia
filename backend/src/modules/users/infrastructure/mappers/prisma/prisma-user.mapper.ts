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

const builder = new UserDatabaseBuilder()
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
      .roles(roles)
      .middleName(likeEntity.middle_name?.trim() || undefined);

    // positions, areas, username, password_hash y email son opcionales en la
    // BD: los empleados importados como personas (is_account = FALSE) no
    // tienen credenciales ni area/cargo hasta que se configuren a mano.
    if (likeEntity.positions) {
      builder.position(PrismaPositionMapper.toDomain(likeEntity.positions));
    }
    if (likeEntity.areas) {
      builder.area(PrismaAreaMapper.toDomain(likeEntity.areas));
    }
    if (likeEntity.username) {
      builder.username(likeEntity.username.trim());
    }
    if (likeEntity.password_hash) {
      builder.passwordHash(HashedPassword.create(likeEntity.password_hash));
    }
    if (likeEntity.email) {
      builder.email(likeEntity.email.trim());
    }

    return builder
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
      place_of_birth: user.placeOfBirth?.value ?? null,
      address: user.address?.value ?? null,
      phone: user.phone?.value ?? null,
    };
  }

  static toCreate(entity: User): Prisma.usersCreateInput {
    const data: Prisma.usersCreateInput = {
      ...PrismaUserMapper.basicData(entity),
      email: entity.email?.value ?? null,
      password_hash: entity.passwordHash?.value ?? null,
      username: entity.username?.value ?? null,
      id: entity.metadata.id,
      created_at: entity.metadata.createdAt,
      updated_at: entity.metadata.updatedAt,
      document_details: {
        create: PrismaDocumentDetailsMapper.toCreate(entity.documentDetails),
      },
      user_roles: {
        create: entity.roles.map((role) => ({
          roles: { connect: { id: role.metadata.id } },
        })),
      },
    };

    // Solo para cuentas (is_account = true) se conectan position/area/credenciales
    if (entity.position) {
      data.positions = { connect: { id: entity.position.metadata.id } };
    }
    if (entity.area) {
      data.areas = { connect: { id: entity.area.metadata.id } };
    }

    return data;
  }

  static toUpdate(entity: User): Prisma.usersUpdateInput {
    const data: Prisma.usersUpdateInput = {
      ...PrismaUserMapper.basicData(entity),
      updated_at: entity.metadata.updatedAt,
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

    if (entity.position) {
      data.positions = { connect: { id: entity.position.metadata.id } };
    }
    if (entity.area) {
      data.areas = { connect: { id: entity.area.metadata.id } };
    }
    if (entity.username) {
      data.username = entity.username.value;
    }
    if (entity.passwordHash) {
      data.password_hash = entity.passwordHash.value;
    }
    if (entity.email) {
      data.email = entity.email.value;
    }

    return data;
  }
}
