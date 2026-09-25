import type { Express } from 'express';
import incidenciasRouter from './routes/incidencias.routes';

const incidencias = {
  // basePath permite montar temporalmente como `/api/incidencias-v2` durante la
  // verificación de paridad y dejar el default `/api/incidencias` en el switch.
  addRoutes: (app: Express, basePath = '/api/incidencias') => {
    app.use(basePath, incidenciasRouter);
  },
};

export default incidencias;