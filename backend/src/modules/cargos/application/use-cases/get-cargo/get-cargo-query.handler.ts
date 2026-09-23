import type { CargoRepository } from '@modules/cargos/domain/repositories/cargo-repository';
import type { CargoDetailsDto } from '../../common/dtos/cargo-details.dto';
import type { GetCargoQueryDto } from './get-cargo-query.dto';
import { CargoMapper } from '../../mappers/cargo.mapper';

export class GetCargoQueryHandler {
  constructor(private readonly cargoRepository: CargoRepository) {}

  async handle(request: GetCargoQueryDto): Promise<CargoDetailsDto | null> {
    const cargo = await this.cargoRepository.getById(request.id);
    return cargo ? CargoMapper.toDetailsDto(cargo) : null;
  }
}