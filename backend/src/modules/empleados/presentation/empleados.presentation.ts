import type { Express } from 'express';
import empleadosRouter from './routes/empleados.routes';

const empleados = {
  addRoutes: (app: Express) => {
    app.use('/api/empleados', empleadosRouter);
  },
};

export default empleados;