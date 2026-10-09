import type { Cargo } from '@modules/cargos/domain/entities/cargo';
import type { CargoListItemDto } from '../common/dtos/cargo-list-item.dto';
import type { CargoDetailsDto } from '../common/dtos/cargo-details.dto';

export class CargoMapper {
  static toListItemDto(cargo: Cargo, cantidadEmpleados: number): CargoListItemDto {
    const areaNombre = cargo.areaName || '';
    return {
      id: cargo.metadata.id,
      nombre: cargo.name.value,
      name: cargo.name.value,
      descripcion: cargo.description,
      description: cargo.description,
      estado: cargo.active ? 'activo' : 'inactivo',
      area_id: cargo.areaId ?? null,
      area: cargo.areaId ? { id: cargo.areaId, nombre: areaNombre } : null,
      areas: areaNombre,
      empleados_count: cantidadEmpleados,
    };
  }

  static toDetailsDto(cargo: Cargo): CargoDetailsDto {
    const areaNombre = cargo.areaName || '';
    return {
      id: cargo.metadata.id,
      nombre: cargo.name.value,
      name: cargo.name.value,
      descripcion: cargo.description,
      description: cargo.description,
      estado: cargo.active ? 'activo' : 'inactivo',
      area_id: cargo.areaId ?? null,
      area: cargo.areaId ? { id: cargo.areaId, nombre: areaNombre } : null,
      areas: areaNombre,
    };
  }
}