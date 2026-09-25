import type { Express } from 'express';
import reportsRouter from './routes/reports.routes';

const reports = {
  addRoutes: (app: Express) => {
    app.use('/api/reportes', reportsRouter);
  },
};

export default reports;
