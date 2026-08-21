import { Prisma } from '@config/database/prisma/generated/client.js';
import { User } from '../../../domain/entities/user.js';
import type { UserBuilder } from '../../../domain/interfaces/user-builder.js';
import type { Uuid } from '@shared/types/uuid.js';
import type { PrismaDocumentDetailsMapper } from './prisma-document-details.mapper.js';
import type { PrismaPositionMapper } from './prisma-position.mapper.js';
import { HashedPassword } from '../../../domain/value-objects/hashed-password.js';
import type { PrismaAreaMapper } from '../../../../areas/infrastructure/mappers/prisma/prisma-area-mapper.js';
import type { PrismaRoleMapper } from './prisma-role.mapper.js';
import type { OrmMapper } from '@shared/mappers/orm.mapper.js';

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

export class PrismaUserMapper implements OrmMapper<
  User,
  PrismaUser,
  Prisma.usersCreateInput,
  Prisma.usersUpdateInput
> {
  constructor(
    private readonly documentDetailsMapper: PrismaDocumentDetailsMapper,
    private readonly positionMapper: PrismaPositionMapper,
    private readonly areaMapper: PrismaAreaMapper,
    private readonly roleMapper: PrismaRoleMapper,
    private readonly userBuilder: UserBuilder,
  ) {}

  toDomain(likeEntity: PrismaUser): User {
    const roles = likeEntity.user_roles.map(({ roles }) => {
      return this.roleMapper.toDomain(roles);
    });

    return this.userBuilder
      .documentDetails(
        this.documentDetailsMapper.toDomain(likeEntity.document_details),
      )
      .firstName(likeEntity.first_name)
      .firstSurname(likeEntity.first_surname)
      .secondSurname(likeEntity.second_surname)
      .dateOfBirth(likeEntity.date_of_birth)
      .placeOfBirth(likeEntity.place_of_birth)
      .address(likeEntity.address)
      .cell(likeEntity.cell)
      .position(this.positionMapper.toDomain(likeEntity.positions))
      .area(this.areaMapper.toDomain(likeEntity.area))
      .username(likeEntity.username)
      .password(HashedPassword.create(likeEntity.password))
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

  private basicData(user: User) {
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

  toCreate(entity: User): Prisma.usersCreateInput {
    return {
      ...this.basicData(entity),
      email: entity.email.value,
      password: entity.password.value,
      username: entity.username.value,
      id: entity.metadata!.id,
      created_at: entity.metadata!.createdAt,
      updated_at: entity.metadata!.updatedAt,
      positions: { connect: { id: entity.position.metadata!.id } },
      area: { connect: { id: entity.area.metadata!.id } },
      document_details: {
        create: this.documentDetailsMapper.toCreate(entity.documentDetails),
      },
    };
  }

  toUpdate(entity: User): Prisma.usersUpdateInput {
    return {
      ...this.basicData(entity),
      updated_at: entity.metadata!.updatedAt,
      positions: { connect: { id: entity.position.metadata!.id } },
      area: { connect: { id: entity.area.metadata!.id } },
      document_details: {
        update: this.documentDetailsMapper.toUpdate(entity.documentDetails),
      },
    };
  }
}
