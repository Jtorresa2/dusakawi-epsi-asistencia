import type { CargoRepository } from '@modules/cargos/domain/repositories/cargo-repository';
import type { CargoListItemDto } from '../../common/dtos/cargo-list-item.dto';
import type { GetCargosQueryDto } from './get-cargos-query.dto';
import { CargoMapper } from '../../mappers/cargo.mapper';

export class GetCargosQueryHandler {
  constructor(private readonly cargoRepository: CargoRepository) {}

  async handle(_request?: GetCargosQueryDto): Promise<CargoListItemDto[]> {
    const cargos = await this.cargoRepository.getAll();

    return cargos.map(({ cargo, empleadosCount }) =>
      CargoMapper.toListItemDto(cargo, empleadosCount),
    );
  }
}