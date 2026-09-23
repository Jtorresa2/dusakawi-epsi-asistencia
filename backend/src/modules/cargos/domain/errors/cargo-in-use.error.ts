import { DomainError } from '@shared/errors/domain.error';

export class CargoInUseError extends DomainError {
  readonly code = 'CARGO_IN_USE';

  constructor() {
    super('El cargo está asignado a uno o más empleados');
  }
}