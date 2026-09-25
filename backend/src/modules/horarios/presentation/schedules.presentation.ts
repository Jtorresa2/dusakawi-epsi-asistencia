import type { Express } from 'express';
import schedulesRouter from './routes/schedules.routes';

const schedules = {
  addRoutes: (app: Express) => {
    app.use('/api/horarios', schedulesRouter);
  },
};

export default schedules;
