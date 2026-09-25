import type { Express } from 'express';
import configRouter from './routes/config.routes';

const config = {
  addRoutes: (app: Express) => {
    app.use('/api/config', configRouter);
  },
};

export default config;