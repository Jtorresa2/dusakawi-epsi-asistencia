import type { Express } from 'express';
import cargosRouter from './routes/cargos.routes';

const cargos = {
  addRoutes: (app: Express) => {
    app.use('/api/cargos', cargosRouter);
  },
};

export default cargos;