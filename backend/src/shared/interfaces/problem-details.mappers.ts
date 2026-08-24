import type { ProblemDetails } from '@shared/types/problem-details.js';

export interface ProblemDetailsMappers<T> {
  toProblemDetails: (err: unknown, req: T) => ProblemDetails;
}
