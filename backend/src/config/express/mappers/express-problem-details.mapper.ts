import { DomainError } from '@shared/errors/domain.error.js';
import type { HttpErrorRegistry } from '@shared/http/errors/http-error-registry.js';
import type { ProblemDetailsMappers } from '@shared/interfaces/problem-details.mappers.js';
import type { ProblemDetails } from '@shared/types/problem-details.js';
import type { Request } from 'express';

export class ExpressProblemDetailsMapper implements ProblemDetailsMappers<Request> {
  constructor(private readonly registry: HttpErrorRegistry) {}

  toProblemDetails(error: unknown, req: Request): ProblemDetails {
    if (error instanceof DomainError) {
      const { status, type, title } = this.registry.resolve(error);
      return {
        type,
        title,
        status,
        detail: error.message,
        instance: req.originalUrl,
        ...(error.metadata ?? {}),
      };
    }

    return {
      type: 'https://miapi.com/errors/internal-server-error',
      title: 'Internal server error',
      status: 500,
      detail: 'Unexpected error has occurred. Please try again later.',
      instance: req.originalUrl,
    };
  }
}
