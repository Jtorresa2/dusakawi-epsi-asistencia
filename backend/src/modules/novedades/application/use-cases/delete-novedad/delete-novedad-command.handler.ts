import type { NovedadRepository } from '@modules/novedades/domain/repositories/novedad-repository';

export interface DeleteNovedadCommandDto {
  id: string;
}

export class DeleteNovedadCommandHandler {
  constructor(private readonly novedadRepository: NovedadRepository) {}

  async handle(command: DeleteNovedadCommandDto): Promise<void> {
    await this.novedadRepository.eliminar(command.id);
  }
}