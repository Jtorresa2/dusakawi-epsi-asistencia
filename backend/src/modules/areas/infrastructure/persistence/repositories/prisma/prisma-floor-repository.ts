import { prisma } from '@config/database/prisma/prisma.js';
import type { Uuid } from '@shared/types/uuid.js';
import type { FloorRepository } from '../../../../domain/repositories/floor-repository.js';
import type { Floor } from '../../../../domain/entities/floor.js';
import { PrismaFloorMapper } from '../../../mappers/prisma/prisma-floor.mapper.js';

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
