import type { FestivoBasico } from '@modules/festivos/domain/entities/festivo';
import type { FestivoRepository } from '@modules/festivos/domain/repositories/festivo-repository';

export interface VerifyFestivoQueryDto {
  fecha: string;
}

export class VerifyFestivoQueryHandler {
  constructor(private readonly festivoRepository: FestivoRepository) {}

  async handle(query: VerifyFestivoQueryDto): Promise<FestivoBasico | null> {
    return this.festivoRepository.verificar(query.fecha);
  }
}