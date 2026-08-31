import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { Environment } from '@config/environment.js';
import users from './modules/users/presentation/user.presentation.js';
import { buildContainer } from '@config/injections.js';
import { containerScopeMiddleware } from '@config/express/middlewares/container-scope.middleware.js';
import { ExpressProblemDetailsMapper } from '@config/express/mappers/express-problem-details.mapper.js';
import { createErrorHandler } from '@config/express/middlewares/error-handler.middleware.js';
import { httpErrorRegistry } from '@shared/http/errors/http-error-registry.config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const container = buildContainer();

app.use(containerScopeMiddleware(container));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(cors());

// =======================
// Rutas
// =======================

users.addRoutes(app);

// =======================

app.get('/', (_, res) => {
  res.json({
    mensaje: 'API Dusakawi EPSI activa',
  });
});

const mapper = new ExpressProblemDetailsMapper(httpErrorRegistry);
app.use(createErrorHandler(mapper));

const PORT = Environment.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
