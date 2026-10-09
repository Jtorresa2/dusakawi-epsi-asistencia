import type { Uuid } from '@shared/types/uuid';
import { DataString } from '@shared/value-objects/data-string';
import { Cargo } from '@modules/cargos/domain/entities/cargo';
import type { CargoRepository } from '@modules/cargos/domain/repositories/cargo-repository';
import type { CreateCargoCommandDto } from './create-cargo-command.dto';

export interface CreateCargoResultDto {
  mensaje: string;
  id: Uuid;
}

export class CreateCargoCommandHandler {
  constructor(private readonly cargoRepository: CargoRepository) {}

  async handle(request: CreateCargoCommandDto): Promise<CreateCargoResultDto> {
    const nombre = request.nombre || request.name;
    if (!nombre) {
      throw new Error('El nombre del cargo es obligatorio');
    }
    const descripcion = request.descripcion || request.description || '';
    const rawAreaId = request.area_id ?? request.areaId ?? null;
    const areaId = rawAreaId === '' ? null : rawAreaId;
    const active = request.active ?? (request.estado ? request.estado !== 'inactivo' : true);

    const cargo = new Cargo(DataString.create(nombre), descripcion, areaId, null, active);
    const id = await this.cargoRepository.create(cargo);

    return { mensaje: 'Cargo creado correctamente', id };
  }
}