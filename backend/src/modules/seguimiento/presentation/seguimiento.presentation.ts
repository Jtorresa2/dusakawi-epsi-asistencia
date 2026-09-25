import type { Express } from 'express';
import seguimientoRouter from './routes/seguimiento.routes';

const seguimiento = {
  // basePath permite montar temporalmente como `/api/seguimiento-v2` durante la
  // verificación de paridad y dejar el default `/api/seguimiento` en el switch.
  addRoutes: (app: Express, basePath = '/api/seguimiento') => {
    app.use(basePath, seguimientoRouter);
  },
};

export default seguimiento;