import { DomainError } from './domain.error.js';

export class NotFoundError extends DomainError {
  readonly code = 'NOT_FOUND';

  constructor(resource: string, id?: string | number) {
    super(
      id ? `${resource} with id '${id}' not found` : `${resource} not found`,
    );
  }
}

export class ValidationError extends DomainError {
  readonly code = 'VALIDATION_FAILED';

  constructor(message: string) {
    super(message);
  }
}

export class UnauthorizedError extends DomainError {
  readonly code = 'UNAUTHORIZED';
  constructor(message = 'No authenticated') {
    super(message);
  }
}

export class ForbiddenError extends DomainError {
  readonly code = 'FORBIDDEN';
  constructor(message = 'No permissions to do this action') {
    super(message);
  }
}

export class ConflictError extends DomainError {
  readonly code = 'CONFLICT';
  constructor(message: string) {
    super(message);
  }
}
