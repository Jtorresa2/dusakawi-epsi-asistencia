import type { Cargo } from '@modules/cargos/domain/entities/cargo';
import type { CargoListItemDto } from '../common/dtos/cargo-list-item.dto';
import type { CargoDetailsDto } from '../common/dtos/cargo-details.dto';

export class CargoMapper {
  static toListItemDto(cargo: Cargo, cantidadEmpleados: number): CargoListItemDto {
    return {
      id: cargo.metadata.id,
      nombre: cargo.name.value,
      name: cargo.name.value,
      descripcion: cargo.description,
      description: cargo.description,
      estado: 'activo',
      empleados_count: cantidadEmpleados,
    };
  }

  static toDetailsDto(cargo: Cargo): CargoDetailsDto {
    return {
      id: cargo.metadata.id,
      nombre: cargo.name.value,
      name: cargo.name.value,
      descripcion: cargo.description,
      description: cargo.description,
      estado: 'activo',
    };
  }
}