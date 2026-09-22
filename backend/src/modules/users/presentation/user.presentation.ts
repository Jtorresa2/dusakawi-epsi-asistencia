import type { Express } from 'express';
import userRouter from './routes/users.routes';

const users = {
  addRoutes: (app: Express) => {
    app.use('/api/users', userRouter);
  },
};

export default users;
