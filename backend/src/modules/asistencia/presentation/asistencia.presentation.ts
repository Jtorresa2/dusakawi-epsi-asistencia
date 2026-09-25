import type { Express } from 'express';
import asistenciaRouter from './routes/asistencia.routes';

const asistencia = {
  // basePath permite montar temporalmente como `/api/asistencia-v2` durante la
  // verificación de paridad y dejar el default `/api/asistencia` en el switch.
  addRoutes: (app: Express, basePath = '/api/asistencia') => {
    app.use(basePath, asistenciaRouter);
  },
};

export default asistencia;