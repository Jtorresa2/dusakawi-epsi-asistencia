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
import usuarios from '@modules/usuarios/presentation/usuarios.presentation';
import areas from '@modules/areas/presentation/areas.presentation';
import cargos from '@modules/cargos/presentation/cargos.presentation';
import dashboard from '@modules/dashboard/presentation/dashboard.presentation';
import config from '@modules/config/presentation/config.presentation';
import empleados from '@modules/empleados/presentation/empleados.presentation';
import festivos from '@modules/festivos/presentation/festivos.presentation';
import novedades from '@modules/novedades/presentation/novedades.presentation';
import incidencias from '@modules/incidencias/presentation/incidencias.presentation';
import seguimiento from '@modules/seguimiento/presentation/seguimiento.presentation';
import asistencia from '@modules/asistencia/presentation/asistencia.presentation';
import schedules from '@modules/horarios/presentation/schedules.presentation';
import reports from '@modules/reportes/presentation/reports.presentation';

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
usuarios.addRoutes(app);
areas.addRoutes(app);
cargos.addRoutes(app);
dashboard.addRoutes(app);
config.addRoutes(app);
empleados.addRoutes(app);
festivos.addRoutes(app);
novedades.addRoutes(app);
incidencias.addRoutes(app);
seguimiento.addRoutes(app);
asistencia.addRoutes(app, '/api/asistencia');
schedules.addRoutes(app);
reports.addRoutes(app);

// =======================================================
// Rutas JavaScript Rescatadas (Coexistencia Híbrida CJS)
// =======================================================
const authLegacyRoutes = require('./routes/authRoutes.js');
const pdfRoutes = require('./routes/pdfRoutes.js');
const reportesRoutes = require('./routes/reportesRoutes.js');

app.use('/api/auth', authLegacyRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/reportes', reportesRoutes);

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
