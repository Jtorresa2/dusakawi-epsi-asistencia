import type { CrearFestivoData } from '@modules/festivos/domain/entities/festivo';
import type { FestivoCreado, FestivoRepository } from '@modules/festivos/domain/repositories/festivo-repository';

export interface CreateFestivoCommandDto {
  data: CrearFestivoData;
}

export class CreateFestivoCommandHandler {
  constructor(private readonly festivoRepository: FestivoRepository) {}

  async handle(command: CreateFestivoCommandDto): Promise<FestivoCreado> {
    return this.festivoRepository.crear(command.data);
  }
}