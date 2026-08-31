import type { Uuid } from '@shared/types/uuid.js';
import type { Prisma } from '@config/database/prisma/generated/client.js';
import { prisma } from '@config/database/prisma/prisma.js';
import type { Position } from '../../../../domain/entities/position.js';
import type { PositionRepository } from '../../../../domain/repositories/position-repository.js';
import type { DataString } from '@shared/value-objects/data-string.js';
import { PrismaPositionMapper } from '../../../mappers/prisma/prisma-position.mapper.js';

export class PrismaPositionRepository implements PositionRepository {
  private async findPositionByUniqueInput(
    where: Prisma.positionsWhereUniqueInput,
  ): Promise<Position | null> {
    const position = await prisma.positions.findUnique({ where });
    return position ? PrismaPositionMapper.toDomain(position) : null;
  }

  async create(entity: Position): Promise<void> {
    await prisma.positions.create({
      data: PrismaPositionMapper.toCreate(entity),
    });
  }

  async update(id: Uuid, entity: Position): Promise<void> {
    await prisma.positions.update({
      where: { id },
      data: PrismaPositionMapper.toUpdate(entity),
    });
  }

  async delete(id: Uuid): Promise<void> {
    await prisma.positions.delete({ where: { id } });
  }

  async findById(id: Uuid): Promise<Position | null> {
    return await this.findPositionByUniqueInput({ id });
  }

  async findAll(): Promise<Position[]> {
    const positions = await prisma.positions.findMany();
    return positions.map((position) => PrismaPositionMapper.toDomain(position));
  }

  async getPositionByName(name: DataString): Promise<Position | null> {
    return await this.findPositionByUniqueInput({ name: name.value });
  }

  async getPositionByDescription(
    description: DataString,
  ): Promise<Position | null> {
    const position = await prisma.positions.findFirst({
      where: { description: description.value },
    });

    return position ? PrismaPositionMapper.toDomain(position) : null;
  }
}
