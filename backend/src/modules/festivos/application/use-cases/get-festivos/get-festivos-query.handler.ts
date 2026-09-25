import type { FestivoRow } from '@modules/festivos/domain/entities/festivo';
import type { FestivoRepository } from '@modules/festivos/domain/repositories/festivo-repository';

export interface GetFestivosQueryDto {
  activo: boolean | null;
}

export class GetFestivosQueryHandler {
  constructor(private readonly festivoRepository: FestivoRepository) {}

  async handle(query: GetFestivosQueryDto): Promise<FestivoRow[]> {
    return this.festivoRepository.obtenerTodos(query.activo);
  }
}