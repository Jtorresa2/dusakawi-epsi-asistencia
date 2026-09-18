import { Response, NextFunction } from 'express';
import { UserRole, AuthRequest } from '../types';

/**
 * Role-based access control middleware.
 * Must be used AFTER authMiddleware (requires req.user to be set).
 *
 * Usage: rol('admin', 'talento_humano')
 */
const rol = (...rolesPermitidos: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !rolesPermitidos.includes(req.user.rol)) {
      res.status(403).json({ mensaje: 'No tienes permiso para esta acción' });
      return;
    }
    next();
  };
};

export default rol;
