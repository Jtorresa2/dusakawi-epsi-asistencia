import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { Environment } from '@config/environment.js';
import { containerScopeMiddleware } from '@config/express/middlewares/container-scope.middleware.js';
import { ExpressProblemDetailsMapper } from '@config/express/mappers/express-problem-details.mapper.js';
import { buildContainer } from '@config/injections.js';
import { createErrorHandler } from '@config/express/middlewares/error-handler.middleware.js';
import { httpErrorRegistry } from '@shared/http/errors/http-error-registry.config.js';
import auth from '@modules/auth/presentation/auth.presentation.js';
import users from '@modules/users/presentation/user.presentation.js';
import areas from '@modules/areas/presentation/areas.presentation';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const app = express();
const container = buildContainer();

app.use(containerScopeMiddleware(container));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(cors());

// =======================================================
// Rutas TypeScript (Fuente de verdad)
// =======================================================
auth.addRoutes(app);
users.addRoutes(app);
areas.addRoutes(app);

// =======================================================
// Rutas JavaScript Rescatadas (Coexistencia Híbrida CJS)
// =======================================================
const authLegacyRoutes = require('./routes/authRoutes.js');
const asistenciaRoutes = require('./routes/asistenciaRoutes.js');
const cargoRoutes = require('./routes/cargoRoutes.js');
const configRoutes = require('./routes/configRoutes.js');
const dashboardRoutes = require('./routes/dashboardRoutes.js');
const empleadoRoutes = require('./routes/empleadoRoutes.js');
const festivosRoutes = require('./routes/festivosRoutes.js');
const horarioRoutes = require('./routes/horarioRoutes.js');
const incidenciaRoutes = require('./routes/incidenciaRoutes.js');
const novedadesRoutes = require('./routes/novedadesRoutes.js');
const pdfRoutes = require('./routes/pdfRoutes.js');
const reportesRoutes = require('./routes/reportesRoutes.js');
const usuariosRoutes = require('./routes/usuariosRoutes.js');

app.use('/api/auth', authLegacyRoutes);
app.use('/api/asistencia', asistenciaRoutes);
app.use('/api/cargos', cargoRoutes);
app.use('/api/config', configRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/empleados', empleadoRoutes);
app.use('/api/festivos', festivosRoutes);
app.use('/api/horarios', horarioRoutes);
app.use('/api/incidencias', incidenciaRoutes);
app.use('/api/novedades', novedadesRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/usuarios', usuariosRoutes);

// =======================================================

app.get('/', (_, res) => {
  res.json({
    mensaje: 'API Dusakawi EPSI activa (Frankenstein Funcional)',
  });
});

const mapper = new ExpressProblemDetailsMapper(httpErrorRegistry);
app.use(createErrorHandler(mapper));

const PORT = Environment.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
