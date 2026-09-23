import type { CargoRepository } from '@modules/cargos/domain/repositories/cargo-repository';
import type { DeleteCargoCommandDto } from './delete-cargo-command.dto';

export interface DeleteCargoResultDto {
  mensaje: string;
}

export class DeleteCargoCommandHandler {
  constructor(private readonly cargoRepository: CargoRepository) {}

  async handle(request: DeleteCargoCommandDto): Promise<DeleteCargoResultDto> {
    await this.cargoRepository.delete(request.id);
    return { mensaje: 'Cargo eliminado correctamente' };
  }
}