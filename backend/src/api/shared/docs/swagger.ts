import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import path from 'path';

const featuresDir = path.join(__dirname, '../../features').replace(/\\/g, '/');

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Dusakawi EPSI — API de Asistencia',
      version: '1.0.0',
      description:
        'API REST para el sistema de control de asistencia, horarios, incidencias y reportes de Dusakawi EPSI.',
      contact: {
        name: 'Dusakawi EPSI',
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}`,
        description: 'Servidor de desarrollo',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'token',
          description: 'Token JWT enviado automáticamente en la cookie "token" tras el login.',
        },
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT en el header Authorization: Bearer <token>',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Error al procesar la solicitud' },
          },
        },
      },
    },
    security: [{ cookieAuth: [] }, { bearerAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Autenticación y gestión de sesión' },
      { name: 'Empleados', description: 'Gestión de empleados' },
      { name: 'Usuarios', description: 'Gestión de usuarios, roles y permisos' },
      { name: 'Areas', description: 'Gestión de áreas organizacionales' },
      { name: 'Cargos', description: 'Gestión de cargos' },
      { name: 'Horarios', description: 'Gestión y asignación de horarios' },
      { name: 'Asistencia', description: 'Consulta de registros de asistencia' },
      { name: 'Marcacion', description: 'Registro de marcaciones desde dispositivo biométrico' },
      { name: 'Incidencias', description: 'Solicitud y gestión de incidencias' },
      { name: 'Novedades', description: 'Novedades y comunicados internos' },
      { name: 'Festivos', description: 'Gestión de días festivos' },
      { name: 'Reportes', description: 'Reportes y estadísticas de asistencia' },
      { name: 'Dashboard', description: 'Indicadores y resumen ejecutivo' },
      { name: 'Seguimiento', description: 'Seguimiento de acciones del sistema' },
      { name: 'Configuracion', description: 'Configuración general del sistema' },
      { name: 'PDF', description: 'Generación de reportes en PDF' },
    ],
  },
  // Lee los comentarios JSDoc de todos los archivos de rutas
  // NOTA: En Windows, path.join usa '\' pero swagger-jsdoc necesita '/'
  apis: [`${featuresDir}/**/*.ts`, `${featuresDir}/**/*.js`],
};

const swaggerSpec = swaggerJsdoc(options);

export function configurarSwagger(app: Express): void {
  // Servir la UI de Swagger
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: 'Dusakawi EPSI — API Docs',
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    })
  );

  // Exponer el JSON del spec (útil para importar en Postman, Insomnia, etc.)
  app.get('/api-docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log(`📚 Swagger UI disponible en http://localhost:${process.env.PORT || 5000}/api-docs`);
}
