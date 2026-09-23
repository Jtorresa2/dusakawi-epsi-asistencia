import { Prisma } from '@config/database/prisma/generated/client';
import { prisma } from '@config/database/prisma/prisma';
import type { Uuid } from '@shared/types/uuid';
import { CargoInUseError } from '@modules/cargos/domain/errors/cargo-in-use.error';
import type { Cargo, CargoWithCount } from '@modules/cargos/domain/entities/cargo';
import type { CargoRepository } from '@modules/cargos/domain/repositories/cargo-repository';
import { PrismaCargoMapper } from '@modules/cargos/infrastructure/mappers/prisma/prisma-cargo-mapper';

type PrismaCargoWithCount = Prisma.positionsGetPayload<{
  include: { _count: { select: { users: true } } };
}>;

export class PrismaCargoRepository implements CargoRepository {
  async getAll(): Promise<CargoWithCount[]> {
    const positions = await prisma.positions.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { users: true } } },
    });

    return positions.map((position: PrismaCargoWithCount) => ({
      cargo: PrismaCargoMapper.toDomain(position),
      empleadosCount: position._count.users,
    }));
  }

  async getById(id: Uuid): Promise<Cargo | null> {
    const position = await prisma.positions.findUnique({ where: { id } });

    return position ? PrismaCargoMapper.toDomain(position) : null;
  }

  async create(cargo: Cargo): Promise<Uuid> {
    const created = await prisma.positions.create({
      data: PrismaCargoMapper.toCreate(cargo),
      select: { id: true },
    });

    return created.id as Uuid;
  }

  async update(id: Uuid, cargo: Cargo): Promise<void> {
    await prisma.positions.updateMany({
      where: { id },
      data: PrismaCargoMapper.toUpdate(cargo),
    });
  }

  async delete(id: Uuid): Promise<void> {
    try {
      await prisma.positions.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        return;
      }

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new CargoInUseError();
      }

      throw error;
    }
  }
}