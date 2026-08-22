import type { Express } from 'express';
import authRouter from './routes/auth.routes.js';

const users = {
  addRoutes: (app: Express) => {
    app.use('/api/auth', authRouter);
  },
};

export default users;
