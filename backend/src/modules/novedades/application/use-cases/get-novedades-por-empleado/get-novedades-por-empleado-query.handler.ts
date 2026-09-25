import type { NovedadRow } from '@modules/novedades/domain/entities/novedad';
import type { NovedadRepository } from '@modules/novedades/domain/repositories/novedad-repository';

export interface GetNovedadesPorEmpleadoQueryDto {
  empleadoId: string;
}

export class GetNovedadesPorEmpleadoQueryHandler {
  constructor(private readonly novedadRepository: NovedadRepository) {}

  async handle(query: GetNovedadesPorEmpleadoQueryDto): Promise<NovedadRow[]> {
    return this.novedadRepository.obtenerPorEmpleado(query.empleadoId);
  }
}