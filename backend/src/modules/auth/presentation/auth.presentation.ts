import type { Express } from 'express';
import authRouter from './routes/auth.routes';

const auth = {
  addRoutes: (app: Express) => {
    app.use('/api/auth', authRouter);
  },
};

export default auth;
