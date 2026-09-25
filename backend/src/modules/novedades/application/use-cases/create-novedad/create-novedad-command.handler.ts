import type { CrearNovedadData, ResultadoCrearNovedad } from '@modules/novedades/domain/entities/novedad';
import type { NovedadRepository } from '@modules/novedades/domain/repositories/novedad-repository';

export interface CreateNovedadCommandDto {
  data: CrearNovedadData;
  usuarioId: string | null;
}

export class CreateNovedadCommandHandler {
  constructor(private readonly novedadRepository: NovedadRepository) {}

  async handle(command: CreateNovedadCommandDto): Promise<ResultadoCrearNovedad> {
    return this.novedadRepository.crear(command.data, command.usuarioId);
  }
}