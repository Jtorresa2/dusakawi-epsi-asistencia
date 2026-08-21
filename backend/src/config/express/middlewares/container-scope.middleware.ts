// presentation/middlewares/container-scope.middleware.ts
import { type RequestHandler } from 'express';
import { type AwilixContainer } from 'awilix';

export function containerScopeMiddleware(
  container: AwilixContainer,
): RequestHandler {
  return (req, _res, next) => {
    (req as any).container = container.createScope();
    next();
  };
}
