import type { CargoRepository } from '@modules/cargos/domain/repositories/cargo-repository';
import type { UpdateCargoCommandDto } from './update-cargo-command.dto';

export interface UpdateCargoResultDto {
  mensaje: string;
}

export class UpdateCargoCommandHandler {
  constructor(private readonly cargoRepository: CargoRepository) {}

  async handle(request: UpdateCargoCommandDto): Promise<UpdateCargoResultDto> {
    const nombre = request.nombre || request.name;
    const descripcion = request.descripcion || request.description;

    const cargo = await this.cargoRepository.getById(request.id);
    if (cargo && (nombre || descripcion)) {
      cargo.updateData({ name: nombre, description: descripcion });
      await this.cargoRepository.update(request.id, cargo);
    }

    return { mensaje: 'Cargo actualizado correctamente' };
  }
}