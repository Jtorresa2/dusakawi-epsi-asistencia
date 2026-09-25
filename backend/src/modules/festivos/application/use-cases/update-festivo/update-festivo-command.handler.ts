import type { ActualizarFestivoData } from '@modules/festivos/domain/entities/festivo';
import type { FestivoActualizado, FestivoRepository } from '@modules/festivos/domain/repositories/festivo-repository';

export interface UpdateFestivoCommandDto {
  id: string;
  data: ActualizarFestivoData;
}

export class UpdateFestivoCommandHandler {
  constructor(private readonly festivoRepository: FestivoRepository) {}

  async handle(command: UpdateFestivoCommandDto): Promise<FestivoActualizado> {
    return this.festivoRepository.actualizar(command.id, command.data);
  }
}