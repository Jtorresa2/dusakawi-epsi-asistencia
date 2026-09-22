# Implementation Plan: Integración Funcional del Sistema de Asistencia (Frankenstein Funcional)

**Branch**: `001-frankenstein-functional-integration` | **Date**: 2026-09-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-frankenstein-functional-integration/spec.md`

## Summary

Consolidar y poner en producción inmediata el sistema integral de control de asistencia de DUSAKAWI EPSI mediante el paradigma "Frankenstein Funcional". Se fusionan de forma híbrida los módulos TypeScript refactorizados (`auth`, `users`, `areas`) que actúan como fuente de la verdad con los módulos JavaScript legacy (`asistencia`, `incidencias`, `novedades`, `cargos`, `festivos`, `horarios`, `configuracion`, `dashboard`, `reportes` y `pdf`). Todo el sistema opera sobre el nuevo esquema centralizado de PostgreSQL en Docker complementado con las tablas de horarios y configuración, y el frontend de React se sincroniza para consumir los servicios unificados sin alterar su diseño visual ni incurrir en suites de pruebas automatizadas prohibidas por la constitución.

## Technical Context

**Language/Version**: Node.js 20+ (ESM con interoperabilidad CommonJS vía `createRequire`), TypeScript 5+ / 7+, React 18+ (JavaScript / Vite)

**Primary Dependencies**:
- Backend: Express 5, Awilix (IoC Container), Prisma Client (para repositorios TS), `pg` (Pool nativo para consultas SQL legacy), `bcryptjs`, `jsonwebtoken`, `multer`, `pdfkit`, `cors`, `dotenv`
- Frontend: React 18, Material UI (MUI), Lucide React, Vite

**Storage**: PostgreSQL 17 (Contenedor Docker `dusakawi-postgres` en puerto 5432), almacenamiento local en disco para evidencias y archivos adjuntos (`/uploads`)

**Testing**: **NINGUNO** (Estrictamente prohibido por el Principio V de la Constitución: *Cero Tests y Modificaciones Estrictas*). La validación se realiza mediante verificación funcional directa de flujos descrita en `quickstart.md`.

**Target Platform**: Servidor Linux / Contenedores Docker

**Project Type**: Full-Stack Web Application (Backend Híbrido TS/JS + Frontend SPA React)

**Performance Goals**:
- Registro de marcación en menos de 5 segundos
- Carga de dashboard e indicadores en menos de 3 segundos
- Generación de reportes PDF oficiales en menos de 10 segundos

**Constraints**:
- Cumplimiento irrestricto de la Constitución v2.0 (*Frankenstein Funcional*)
- No continuar la refactorización profunda a TypeScript de los módulos que ya funcionan en JavaScript
- El nuevo esquema PostgreSQL en Docker es la única fuente de datos relacional
- Prohibición total de escribir o reparar tests automatizados
- La lógica de UI del frontend se preserva intacta; solo se actualizan peticiones y servicios (`fetch`/`apiFetch`)

**Scale/Scope**: Operación institucional completa para la sede central y funcionarios de DUSAKAWI EPSI.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principio I (Frankenstein Funcional)**: **PASADO**. Se detiene la refactorización profunda; se rescata el código legacy y se une al código TS para lograr un sistema 100% funcional de inmediato.
- **Principio II (Prioridad del Código Nuevo TypeScript)**: **PASADO**. Los módulos refactorizados (`auth`, `users`, `areas`) son la fuente de verdad y reemplazan los controladores antiguos correspondientes.
- **Principio III (Adaptación al Esquema PostgreSQL en Docker)**: **PASADO**. Todos los módulos JS adaptan sus sentencias SQL para apuntar a las tablas del esquema PostgreSQL (`users`, `attendances`, `incidents`, `positions`, `holidays`).
- **Principio IV (Rescate y Coexistencia Híbrida TS/JS)**: **PASADO**. El servidor Express en `main.ts` carga routers tanto TS como JS CommonJS vía `createRequire` sin fricción.
- **Principio V (Cero Tests y Modificaciones Estrictas)**: **PASADO**. Queda completamente descartado cualquier framework o archivo de test; el código antiguo no se refactoriza estéticamente, solo se adaptan sus queries y contratos.
- **Directrices para el Frontend**: **PASADO**. La UI de React se mantiene en JavaScript; solo se ajustan las llamadas a la API en `src/api` y `features/*/*.api.js`.

## Project Structure

### Documentation (this feature)

```text
specs/001-frankenstein-functional-integration/
├── spec.md              # Especificación funcional validada y clarificada
├── plan.md              # Este plan de implementación
├── research.md          # Fase 0: Decisiones arquitectónicas y de coexistencia
├── data-model.md        # Fase 1: Esquema relacional PostgreSQL y entidades
├── quickstart.md        # Fase 1: Guía de ejecución y verificación funcional
├── contracts/           # Fase 1: Contratos de interfaces y endpoints
│   ├── auth.contract.md
│   ├── asistencia.contract.md
│   ├── empleados-usuarios.contract.md
│   ├── incidencias.contract.md
│   ├── catalogos-config.contract.md
│   └── reportes-pdf.contract.md
└── checklists/
    └── requirements.md  # Validación de calidad de la especificación
```

### Source Code (concrete layout)

```text
backend/
├── docker-compose.yaml                      # PostgreSQL 17 container
├── package.json                             # "type": "module", tsx dev runner
├── tsconfig.json                            # allowJs: true, paths configurados
├── src/
│   ├── main.ts                              # Entrypoint híbrido Express montando TS y JS
│   ├── config/
│   │   ├── db.js                            # Wrapper pg para compatibilidad SQL
│   │   ├── environment.ts                   # Variables de entorno
│   │   ├── injections.ts                    # Contenedor Awilix (TS)
│   │   └── database/
│   │       ├── schema.sql                   # Esquema base PostgreSQL
│   │       ├── complementary_tables.sql     # Tablas complementarias (horarios, config)
│   │       └── prisma/schema.prisma         # Prisma client para módulos TS
│   ├── modules/                             # MÓDULOS REFACTORIZADOS (TypeScript - Fuente de verdad)
│   │   ├── auth/                            # Autenticación, JWT y contraseñas
│   │   ├── users/                           # Gestión integral de usuarios e identidad
│   │   ├── areas/                           # Gestión de áreas y pisos
│   │   └── positions/                       # Entidades y mapeadores de cargos
│   ├── controllers/                         # CONTROLADORES RESCATADOS (JavaScript)
│   │   ├── asistenciaController.js          # Adaptado a tabla attendances
│   │   ├── cargoController.js               # Adaptado a tabla positions
│   │   ├── configController.js              # Adaptado a tabla configuracion
│   │   ├── dashboardController.js           # Adaptado a métricas diarias
│   │   ├── empleadoController.js            # Adaptador sobre tabla users
│   │   ├── festivosController.js            # Adaptado a tabla holidays
│   │   ├── horarioController.js             # Adaptado a tablas horarios y horario_detalle
│   │   ├── incidenciaController.js          # Adaptado a tabla incidents
│   │   ├── novedadesController.js           # Adaptado a tabla incidents
│   │   └── reportesController.js            # Adaptado a reportes consolidados
│   ├── routes/                              # RUTAS EXPRESS RESCATADAS (JavaScript)
│   │   ├── asistenciaRoutes.js
│   │   ├── cargoRoutes.js
│   │   ├── configRoutes.js
│   │   ├── dashboardRoutes.js
│   │   ├── empleadoRoutes.js
│   │   ├── festivosRoutes.js
│   │   ├── horarioRoutes.js
│   │   ├── incidenciaRoutes.js
│   │   ├── novedadesRoutes.js
│   │   ├── pdfRoutes.js                     # Generación documental con PDFKit
│   │   └── reportesRoutes.js
│   ├── middlewares/
│   │   └── authMiddleware.js                # Verificación JWT compartida con auth TS
│   └── services/                            # Servicios SQL adaptados al nuevo esquema
└── uploads/                                 # Directorio de evidencias y adjuntos

frontend/
├── package.json                             # Dependencias cliente
├── src/
│   ├── api/                                 # Clientes API globales (actualizados a /api)
│   │   ├── api.js
│   │   ├── authService.api.js
│   │   ├── area.api.js
│   │   ├── cargo.api.js
│   │   ├── empleado.api.js
│   │   └── horario.api.js
│   ├── features/                            # Vistas y componentes funcionales (UI intacta)
│   │   ├── auth/
│   │   ├── login/
│   │   ├── asistencia/
│   │   ├── miAsistencia/
│   │   ├── incidencias/
│   │   ├── novedades/
│   │   ├── areas/
│   │   ├── cargos/
│   │   ├── horarios/
│   │   ├── festivos/
│   │   ├── configuracion/
│   │   ├── dashboard/
│   │   └── reportes/
│   └── shared/
│       └── api/api.js                       # Configuración de base URL y tokens
```

**Structure Decision**: Se mantiene la arquitectura web full-stack con separación `backend/` y `frontend/`. En el backend se preserva la convivencia de módulos limpios en `modules/` (TS) con las capas rescatadas en `controllers/`, `routes/` y `services/` (JS), orquestadas centralmente por `main.ts`.

## Complexity Tracking

*No existen violaciones constitucionales que requieran justificación. El diseño se apega estrictamente a la Constitución v2.0.*
