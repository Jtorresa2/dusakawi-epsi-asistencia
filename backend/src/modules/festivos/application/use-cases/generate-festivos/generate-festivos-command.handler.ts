import type { ResultadoGenerarFestivos } from '@modules/festivos/domain/entities/festivo';
import type { FestivoRepository } from '@modules/festivos/domain/repositories/festivo-repository';

export interface GenerateFestivosCommandDto {
  year: number;
}

export class GenerateFestivosCommandHandler {
  constructor(private readonly festivoRepository: FestivoRepository) {}

  async handle(command: GenerateFestivosCommandDto): Promise<ResultadoGenerarFestivos> {
    return this.festivoRepository.generarNacionales(command.year);
  }
}