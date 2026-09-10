import type { Express } from 'express';
import areaRouter from './routes/areas.routes';

const areas = {
  addRoutes: (app: Express) => {
    app.use('/api/areas', areaRouter);
  },
};

export default areas;
