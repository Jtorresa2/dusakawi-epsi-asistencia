import type { FestivoRow } from '@modules/festivos/domain/entities/festivo';
import type { FestivoRepository } from '@modules/festivos/domain/repositories/festivo-repository';

export interface GetFestivoQueryDto {
  id: string;
}

export class GetFestivoQueryHandler {
  constructor(private readonly festivoRepository: FestivoRepository) {}

  async handle(query: GetFestivoQueryDto): Promise<FestivoRow | null> {
    return this.festivoRepository.obtenerPorId(query.id);
  }
}