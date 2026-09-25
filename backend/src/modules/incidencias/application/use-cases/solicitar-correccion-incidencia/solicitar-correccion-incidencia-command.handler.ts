import type { IncidenciaRepository } from '../../../domain/repositories/incidencia-repository';

export class SolicitarCorreccionIncidenciaCommandHandler {
  constructor(private readonly incidenciaRepository: IncidenciaRepository) {}

  async handle({ id, observacion, revisadoPor }: { id: string; observacion: string; revisadoPor: string }): Promise<boolean> {
    return this.incidenciaRepository.solicitarCorreccion(id, observacion, revisadoPor);
  }
}