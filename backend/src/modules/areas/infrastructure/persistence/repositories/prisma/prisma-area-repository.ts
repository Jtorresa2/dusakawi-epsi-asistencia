import { prisma } from '@config/database/prisma/prisma.js';
import type { Uuid } from '@shared/types/uuid.js';
import type { Area } from '../../../../domain/entities/area.js';
import type { AreaRepository } from '../../../../domain/repositories/area-repository.js';
import type { PrismaAreaMapper } from '../../../mappers/prisma/prisma-area-mapper.js';

export class PrismaAreaRepository implements AreaRepository {
  private readonly includeEntities = { floors: true };

  constructor(private readonly areaMapper: PrismaAreaMapper) {}

  async create(entity: Area): Promise<void> {
    await prisma.areas.create({ data: this.areaMapper.toCreate(entity) });
  }

  async update(id: Uuid, entity: Area): Promise<void> {
    await prisma.areas.update({
      where: { id },
      data: this.areaMapper.toUpdate(entity),
    });
  }

  async delete(id: Uuid): Promise<void> {
    await prisma.areas.delete({ where: { id } });
  }

  async findById(id: Uuid): Promise<Area | null> {
    const area = await prisma.areas.findUnique({
      where: { id },
      include: this.includeEntities,
    });
    return area ? this.areaMapper.toDomain(area) : null;
  }

  async findAll(): Promise<Area[]> {
    const areas = await prisma.areas.findMany({
      include: this.includeEntities,
    });
    return areas.map((area) => this.areaMapper.toDomain(area));
  }
}
