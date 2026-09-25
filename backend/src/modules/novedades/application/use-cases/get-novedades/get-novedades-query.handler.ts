import type { NovedadRow } from '@modules/novedades/domain/entities/novedad';
import type { NovedadRepository } from '@modules/novedades/domain/repositories/novedad-repository';

export class GetNovedadesQueryHandler {
  constructor(private readonly novedadRepository: NovedadRepository) {}

  async handle(): Promise<NovedadRow[]> {
    return this.novedadRepository.obtenerTodos();
  }
}