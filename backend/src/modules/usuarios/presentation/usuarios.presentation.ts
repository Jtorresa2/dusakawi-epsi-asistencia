import type { Express } from 'express';
import usuariosRouter from './routes/usuarios.routes';

const usuarios = {
  addRoutes: (app: Express) => {
    app.use('/api/usuarios', usuariosRouter);
  },
};

export default usuarios;
