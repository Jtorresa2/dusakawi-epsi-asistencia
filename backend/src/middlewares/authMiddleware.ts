import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload, AuthRequest } from '../types';

/**
 * Authentication middleware.
 *
 * Security improvement: reads the JWT from the HttpOnly cookie `token` first
 * (primary, safe from XSS). Falls back to the Authorization Bearer header for
 * backwards compatibility during the frontend migration window.
 *
 * Once the frontend is fully migrated to cookies, the header fallback can be
 * removed.
 */
const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Cookie takes priority (HttpOnly — not readable by browser JS)
  const cookieToken: string | undefined = (req as any).cookies?.token;
  const headerToken: string | undefined = req.headers.authorization?.split(' ')[1];
  // Also allow ?token= query param for PDF endpoints (legacy, will be removed)
  const queryToken: string | undefined = req.query.token as string | undefined;

  const token = cookieToken ?? headerToken ?? queryToken;

  if (!token) {
    res.status(401).json({ mensaje: 'Token requerido' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    (req as AuthRequest).user = decoded;
    next();
  } catch {
    res.status(401).json({ mensaje: 'Token inválido' });
  }
};

export default authMiddleware;
