import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

// Rate limiter para login: 5 intentos fallidos por IP en 15 minutos
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 intentos
  message: {
    error: 'Demasiados intentos de inicio de sesión. Intentá de nuevo en 15 minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req.ip ?? ''),
  skipSuccessfulRequests: true, // solo cuenta intentos fallidos
});

// Rate limiter para recuperación de contraseña: 3 intentos por IP en 15 minutos
export const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 3, // máximo 3 intentos
  message: {
    error: 'Demasiadas solicitudes de restablecimiento. Intentá de nuevo en 15 minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req.ip ?? ''),
});

// Rate limiter general para auth: 20 requests por IP en 15 minutos
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    error: 'Demasiadas peticiones. Intentá de nuevo en unos minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
