export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'API Dusakawi EPSI - Sistema de Asistencia y Gestión',
    version: '1.0.0',
    description:
      'Documentación interactiva y especificación técnica de la API REST del Sistema de Asistencia Institucional de Dusakawi EPSI.',
    contact: {
      name: 'Equipo de Sistemas - Dusakawi EPSI',
    },
  },
  servers: [
    {
      url: '/api',
      description: 'API Base (Relativa)',
    },
    {
      url: 'http://localhost:5000/api',
      description: 'Servidor Backend',
    },
    {
      url: 'http://localhost:3000/api',
      description: 'Proxy desde Frontend',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'Ingrese el token JWT obtenido del endpoint de inicio de sesión (/auth/login).',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          mensaje: { type: 'string', example: 'Descripción del error' },
        },
      },
      Area: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', example: 'ba05e85f-f75e-4865-81c2-6efe8d39721e' },
          name: { type: 'string', example: 'PQR' },
          nombre: { type: 'string', example: 'PQR' },
          description: { type: 'string', example: 'Peticiones, quejas y reclamos' },
          floor: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string', example: 'Piso 1' },
            },
          },
          piso: { type: 'integer', example: 1 },
        },
      },
      AreaInput: {
        type: 'object',
        required: ['nombre', 'piso'],
        properties: {
          nombre: { type: 'string', example: 'Sistemas' },
          piso: { type: 'integer', example: 2 },
          descripcion: { type: 'string', example: 'Área encargada de infraestructura tecnológica' },
        },
      },
      Cargo: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          nombre: { type: 'string', example: 'Coordinador de Calidad' },
          descripcion: { type: 'string', example: 'Supervisa procesos de calidad institucional' },
          area_id: { type: 'string', format: 'uuid' },
          areas: { type: 'string', example: 'Calidad' },
          estado: { type: 'string', enum: ['activo', 'inactivo'], example: 'activo' },
          empleados_count: { type: 'integer', example: 4 },
        },
      },
      CargoInput: {
        type: 'object',
        required: ['nombre'],
        properties: {
          nombre: { type: 'string', example: 'Analista de Seguridad' },
          descripcion: { type: 'string', example: 'Gestión y control de seguridad' },
          area_id: { type: 'string', format: 'uuid' },
          estado: { type: 'string', enum: ['activo', 'inactivo'], default: 'activo' },
        },
      },
      Empleado: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          cedula: { type: 'string', example: '1065123456' },
          empleado: { type: 'string', example: 'Juan Carlos Pérez Gómez' },
          primer_nombre: { type: 'string', example: 'Juan' },
          segundo_nombre: { type: 'string', example: 'Carlos' },
          primer_apellido: { type: 'string', example: 'Pérez' },
          segundo_apellido: { type: 'string', example: 'Gómez' },
          correo: { type: 'string', format: 'email', example: 'juan.perez@dusakawi.gov.co' },
          telefono: { type: 'string', example: '3001234567' },
          cargo_id: { type: 'string', format: 'uuid' },
          cargo: { type: 'string', example: 'Médico General' },
          area_id: { type: 'string', format: 'uuid' },
          area: { type: 'string', example: 'Medicina General' },
          piso: { type: 'string', example: 'Piso 2' },
          horario_id: { type: 'string', format: 'uuid' },
          horario: { type: 'string', example: 'Turno Diurno Completo' },
          activo: { type: 'integer', enum: [0, 1], example: 1 },
          estado: { type: 'string', enum: ['activo', 'inactivo'], example: 'activo' },
        },
      },
      Horario: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          nombre: { type: 'string', example: 'Horario Administrativo' },
          descripcion: { type: 'string', example: 'Lunes a Viernes 07:00 a 16:00' },
          activo: { type: 'boolean', example: true },
          hora_entrada: { type: 'string', example: '07:00' },
          hora_salida: { type: 'string', example: '16:00' },
          tolerancia_minutos: { type: 'integer', example: 15 },
          dias_semana: {
            type: 'array',
            items: { type: 'string' },
            example: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
          },
        },
      },
      AsignarHorarioInput: {
        type: 'object',
        required: ['usuario_id', 'horario_id'],
        properties: {
          usuario_id: { type: 'string', format: 'uuid' },
          horario_id: { type: 'string', format: 'uuid' },
          motivo: { type: 'string', example: 'Cambio de horario solicitado' },
        },
      },
      LoginInput: {
        type: 'object',
        required: ['username', 'password'],
        properties: {
          username: { type: 'string', example: 'admin' },
          password: { type: 'string', format: 'password', example: '********' },
        },
      },
      LoginResponse: {
        type: 'object',
        properties: {
          token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
          usuario: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              username: { type: 'string' },
              nombre: { type: 'string' },
              rol: { type: 'string' },
            },
          },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  tags: [
    { name: 'Autenticación', description: 'Inicio de sesión, perfil y recuperación de accesos' },
    { name: 'Áreas', description: ' Gestión de áreas y pisos' },
    { name: 'Cargos', description: 'Gestión de cargos y perfiles' },
    { name: 'Empleados', description: 'Gestión del personal' },
    { name: 'Horarios', description: 'Gestión y asignación de horarios de laboral' },
    { name: 'Asistencia', description: 'Marcaciones biométricas, registros de entrada y salida' },
    { name: 'Seguimiento', description: 'Monitoreo diario de asistencia' },
    { name: 'Novedades', description: 'Registro y justificación de novedades laborales e incapacidades' },
    { name: 'Dashboard', description: 'Indicadores clave de rendimiento (KPIs) y analítica' },
    { name: 'Reportes', description: 'Generación y exportación de reportes' },
    { name: 'PDF', description: 'Generación de documentos y actas en formato PDF' },
  ],
  paths: {
    '/auth/login': {
      post: {
        tags: ['Autenticación'],
        summary: 'Iniciar sesión en el sistema',
        description: 'Autentica a un usuario y genera un token JWT para peticiones protegidas.',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginInput' },
            },
          },
        },
        responses: {
          200: {
            description: 'Autenticación exitosa',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginResponse' },
              },
            },
          },
          401: {
            description: 'Credenciales inválidas',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Autenticación'],
        summary: 'Obtener datos del usuario autenticado',
        responses: {
          200: { description: 'Datos del usuario actual' },
          401: { description: 'No autorizado' },
        },
      },
    },
    '/areas': {
      get: {
        tags: ['Áreas'],
        summary: 'Listar todas las áreas',
        description: 'Obtiene el listado completo de áreas junto a sus pisos.',
        parameters: [
          {
            name: 'limit',
            in: 'query',
            description: 'Límite de resultados',
            schema: { type: 'integer', default: 1000 },
          },
        ],
        responses: {
          200: {
            description: 'Listado de áreas',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Area' },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Áreas'],
        summary: 'Crear un nuevo área',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AreaInput' },
            },
          },
        },
        responses: {
          201: { description: 'Área creada exitosamente' },
          400: { description: 'Datos inválidos' },
        },
      },
    },
    '/areas/{id}': {
      get: {
        tags: ['Áreas'],
        summary: 'Obtener información de un área por ID',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: {
            description: 'Detalle del área',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Area' },
              },
            },
          },
          404: { description: 'Área no encontrada' },
        },
      },
      put: {
        tags: ['Áreas'],
        summary: 'Actualizar un área',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AreaInput' },
            },
          },
        },
        responses: {
          200: { description: 'Área actualizada exitosamente' },
        },
      },
      delete: {
        tags: ['Áreas'],
        summary: 'Eliminar un área',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: { description: 'Área eliminada exitosamente' },
        },
      },
    },
    '/areas/{id}/empleados': {
      get: {
        tags: ['Áreas'],
        summary: 'Listar empleados asignados a un área',
        description: 'Retorna todos los empleados pertenecientes al área indicada con su nombre, cédula, cargo y contacto.',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'ID del área',
          },
        ],
        responses: {
          200: {
            description: 'Lista de empleados del área',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Empleado' },
                },
              },
            },
          },
        },
      },
    },
    '/cargos': {
      get: {
        tags: ['Cargos'],
        summary: 'Listar todos los cargos',
        parameters: [
          {
            name: 'estado',
            in: 'query',
            schema: { type: 'string', enum: ['activo', 'inactivo'] },
          },
          {
            name: 'area',
            in: 'query',
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: {
            description: 'Lista de cargos',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Cargo' },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Cargos'],
        summary: 'Crear un nuevo cargo',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CargoInput' },
            },
          },
        },
        responses: {
          201: { description: 'Cargo creado exitosamente' },
        },
      },
    },
    '/cargos/{id}': {
      get: {
        tags: ['Cargos'],
        summary: 'Obtener detalle de un cargo por ID',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: {
            description: 'Detalle del cargo',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Cargo' },
              },
            },
          },
        },
      },
      put: {
        tags: ['Cargos'],
        summary: 'Actualizar un cargo',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CargoInput' },
            },
          },
        },
        responses: {
          200: { description: 'Cargo actualizado exitosamente' },
        },
      },
      delete: {
        tags: ['Cargos'],
        summary: 'Eliminar un cargo',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: { description: 'Cargo eliminado exitosamente' },
        },
      },
    },
    '/empleados': {
      get: {
        tags: ['Empleados'],
        summary: 'Listar empleados (personal)',
        parameters: [
          {
            name: 'cargo',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filtrar por nombre del cargo',
          },
          {
            name: 'area',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filtrar por nombre del área',
          },
          {
            name: 'estado',
            in: 'query',
            schema: { type: 'string', enum: ['activo', 'inactivo'] },
          },
        ],
        responses: {
          200: {
            description: 'Listado de empleados',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    empleados: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Empleado' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/empleados/{id}': {
      get: {
        tags: ['Empleados'],
        summary: 'Obtener expediente de un empleado por ID',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: {
            description: 'Expediente completo del empleado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Empleado' },
              },
            },
          },
        },
      },
      put: {
        tags: ['Empleados'],
        summary: 'Actualizar información de un empleado',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: { description: 'Empleado actualizado' },
        },
      },
    },
    '/horarios': {
      get: {
        tags: ['Horarios'],
        summary: 'Listar todos los horarios disponibles',
        responses: {
          200: {
            description: 'Listado de horarios',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Horario' },
                },
              },
            },
          },
        },
      },
    },
    '/horarios/asignar': {
      post: {
        tags: ['Horarios'],
        summary: 'Asignar horario a un empleado',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AsignarHorarioInput' },
            },
          },
        },
        responses: {
          200: { description: 'Horario asignado exitosamente' },
        },
      },
    },
    '/seguimiento': {
      get: {
        tags: ['Seguimiento'],
        summary: 'Obtener seguimiento de asistencia diaria',
        parameters: [
          {
            name: 'fecha',
            in: 'query',
            schema: { type: 'string', format: 'date' },
            description: 'Fecha a consultar (YYYY-MM-DD)',
          },
        ],
        responses: {
          200: { description: 'Registros diarios de asistencia' },
        },
      },
    },
    '/novedades': {
      get: {
        tags: ['Novedades'],
        summary: 'Listar novedades laborales',
        responses: {
          200: { description: 'Listado de novedades' },
        },
      },
    },
    '/dashboard': {
      get: {
        tags: ['Dashboard'],
        summary: 'Obtener métricas y KPIs del dashboard principal',
        responses: {
          200: { description: 'Métricas consolidadas de asistencia' },
        },
      },
    },
  },
};
