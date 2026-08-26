import type { Express } from 'express';
import authRouter from './routes/auth.routes.js';
import userRouter from './routes/users.routes.js';

const users = {
  addRoutes: (app: Express) => {
    app.use('/api/auth', authRouter);
    app.use('/api/users', userRouter);
  },
};

export default users;
