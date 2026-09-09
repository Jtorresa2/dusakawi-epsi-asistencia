import { prisma } from '@config/database/prisma/prisma';
import type { Uuid } from '@shared/types/uuid';
import type { Floor } from '@modules/areas/domain/entities/floor';
import type { FloorRepository } from '@modules/areas/domain/repositories/floor-repository';
import { PrismaFloorMapper } from '@modules/areas/infrastructure/mappers/prisma/prisma-floor.mapper';

export class PrismaFloorRepository implements FloorRepository {
  async create(entity: Floor): Promise<void> {
    await prisma.floors.create({ data: PrismaFloorMapper.toCreate(entity) });
  }

  async update(id: Uuid, entity: Floor): Promise<void> {
    await prisma.floors.update({
      where: { id },
      data: PrismaFloorMapper.toUpdate(entity),
    });
  }

  async delete(id: Uuid): Promise<void> {
    await prisma.floors.delete({ where: { id } });
  }

  async findById(id: Uuid): Promise<Floor | null> {
    const floor = await prisma.floors.findUnique({ where: { id } });
    return floor ? PrismaFloorMapper.toDomain(floor) : null;
  }

  async findAll(): Promise<Floor[]> {
    const floors = await prisma.floors.findMany();
    return floors.map((floor) => PrismaFloorMapper.toDomain(floor));
  }
}
