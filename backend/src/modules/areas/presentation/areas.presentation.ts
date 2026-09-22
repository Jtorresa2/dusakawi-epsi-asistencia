import type { Express } from 'express';
import areaRouter from './routes/areas.routes';
import floorRouter from './routes/floors.routes';

const areas = {
  addRoutes: (app: Express) => {
    app.use('/api/areas', areaRouter);
    app.use('/api/floors', floorRouter);
  },
};

export default areas;
