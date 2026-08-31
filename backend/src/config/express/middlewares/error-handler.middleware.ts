import type { ExpressProblemDetailsMapper } from '@config/express/mappers/express-problem-details.mapper.js';
import type { NextFunction, Request, Response } from 'express';

const CONTENT_TYPE = 'application/problem+json';

export function createErrorHandler(mapper: ExpressProblemDetailsMapper) {
  return function errorHandler(
    err: unknown,
    req: Request,
    res: Response,
    next: NextFunction,
  ): void {
    const problem = mapper.toProblemDetails(err, req);

    if (problem.status >= 500) {
      console.error(err);
    }

    res.status(problem.status).type(CONTENT_TYPE).json(problem);
  };
}
