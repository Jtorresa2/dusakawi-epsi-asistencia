import type { Express } from 'express';
import novedadesRouter from './routes/novedades.routes';

const novedades = {
  addRoutes: (app: Express) => {
    app.use('/api/novedades', novedadesRouter);
  },
};

export default novedades;