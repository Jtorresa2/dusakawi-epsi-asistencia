import { HttpErrorRegistry } from './http-error-registry.js';

export const httpErrorRegistry = new HttpErrorRegistry()
  .register('NOT_FOUND', {
    status: 404,
    type: 'https://miapi.com/errors/not-found',
    title: 'Resource not found',
  })
  .register('VALIDATION_FAILED', {
    status: 422,
    type: 'https://miapi.com/errors/validation-failed',
    title: 'Failed validation',
  })
  .register('UNAUTHORIZED', {
    status: 401,
    type: 'https://miapi.com/errors/unauthorized',
    title: 'No authenticated',
  })
  .register('FORBIDDEN', {
    status: 403,
    type: 'https://miapi.com/errors/forbidden',
    title: 'Denied access',
  })
  .register('CONFLICT', {
    status: 409,
    type: 'https://miapi.com/errors/conflict',
    title: 'Status conflict',
  });
