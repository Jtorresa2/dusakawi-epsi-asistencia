import type { ActualizarNovedadData } from '@modules/novedades/domain/entities/novedad';
import type { NovedadRepository } from '@modules/novedades/domain/repositories/novedad-repository';

export interface UpdateNovedadCommandDto {
  id: string;
  data: ActualizarNovedadData;
  usuarioId: string | null;
}

export class UpdateNovedadCommandHandler {
  constructor(private readonly novedadRepository: NovedadRepository) {}

  async handle(command: UpdateNovedadCommandDto): Promise<void> {
    await this.novedadRepository.actualizar(command.id, command.data, command.usuarioId);
  }
}