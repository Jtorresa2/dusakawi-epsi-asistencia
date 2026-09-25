import { AwilixContainer } from 'awilix';

declare global {
  namespace Express {
    interface Request {
      container: AwilixContainer;
      // Inyectado por el middleware legacy (src/middlewares/authMiddleware.js):
      // spread del token decodificado + id/userId/empleado_id/rol/rol_original/roles.
      user?: {
        id?: string;
        userId?: string;
        empleado_id?: string;
        rol?: string;
        rol_original?: string;
        roles?: string[];
      };
    }
  }
}
