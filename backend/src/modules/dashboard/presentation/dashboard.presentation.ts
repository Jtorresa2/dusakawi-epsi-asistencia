import type { Express } from 'express';
import dashboardRouter from './routes/dashboard.routes';

const dashboard = {
  addRoutes: (app: Express) => {
    app.use('/api/dashboard', dashboardRouter);
  },
};

export default dashboard;