import type { FestivoEliminado, FestivoRepository } from '@modules/festivos/domain/repositories/festivo-repository';

export interface DeleteFestivoCommandDto {
  id: string;
}

export class DeleteFestivoCommandHandler {
  constructor(private readonly festivoRepository: FestivoRepository) {}

  async handle(command: DeleteFestivoCommandDto): Promise<FestivoEliminado> {
    return this.festivoRepository.eliminar(command.id);
  }
}