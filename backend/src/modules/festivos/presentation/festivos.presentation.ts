import type { Express } from 'express';
import festivosRouter from './routes/festivos.routes';

const festivos = {
  addRoutes: (app: Express) => {
    app.use('/api/festivos', festivosRouter);
  },
};

export default festivos;