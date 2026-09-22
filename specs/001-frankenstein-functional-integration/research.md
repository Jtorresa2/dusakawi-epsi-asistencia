# Technical Research: Integración Frankenstein Funcional

**Feature**: `001-frankenstein-functional-integration`
**Date**: 2026-09-22
**Status**: Completed

## 1. Coexistencia Híbrida TS (ESM) y JS (CommonJS) en Express

### Decision
Utilizar `createRequire(import.meta.url)` de Node.js en `backend/src/main.ts` para importar y registrar las rutas y middlewares CommonJS legacy (`asistenciaRoutes.js`, `cargoRoutes.js`, `configRoutes.js`, `dashboardRoutes.js`, `empleadoRoutes.js`, `festivosRoutes.js`, `horarioRoutes.js`, `incidenciaRoutes.js`, `novedadesRoutes.js`, `pdfRoutes.js`, `reportesRoutes.js`), mientras se mantienen los módulos TypeScript refactorizados (`auth`, `users`, `areas`) registrados a través de sus objetos de presentación existentes.

### Rationale
- Cumple fielmente el **Principio IV** de la Constitución: rescatar el código legacy sin continuar la refactorización profunda.
- Node.js ESM nativo y `tsx watch` soportan `createRequire` de forma transparente para consumir módulos CommonJS (`.js` con `module.exports`) sin fricción de tipos ni necesidad de transpiladores adicionales.
- Se mantiene el contenedor de inyección de dependencias Awilix para los módulos TypeScript y se permite a los módulos legacy acceder a la conexión mediante el pool existente.

### Alternatives Considered
- *Convertir todos los archivos JS a ESM (`import/export`)*: Rechazado porque viola el **Principio V** ("NO se debe intentar mejorar, limpiar o refactorizar el código antiguo").
- *Empaquetar con tsup / Webpack en tiempo de compilación*: Rechazado porque añade sobrecomplejidad al flujo de desarrollo y dificulta la depuración directa.

---

## 2. Adaptación del Pool de Conexión a Base de Datos y Sentencias SQL

### Decision
Mantener el wrapper de compatibilidad en `backend/src/config/db.js` que utiliza `pg.Pool` y adapta los marcadores `?` a `$1, $2, ...` y las respuestas `[rows, fields]`. Modificar en los controladores/servicios legacy exclusivamente los nombres de tablas y columnas para coincidir con el esquema PostgreSQL unificado en Docker:
- `empleado` / `usuarios` → `users` (con `document_details` y `positions`).
- `asistencia` → `attendances` (mapeando a `first_entry_time`, `first_departure_time`, `last_entry_time`, `last_departure_time`).
- `incidencias` → `incidents` (mapeando `user_id`, `reviewed_by`, `signed_file`, `status`).
- `cargos` → `positions` (`id`, `name`, `description`).
- `festivos` → `holidays` (`id`, `name`, `type`, `date`, `active`).

### Rationale
- Cumple con el **Principio III**: el esquema de PostgreSQL definido en Docker se mantiene para todo el sistema y el código JS sólo se modifica en sus sentencias SQL/ORM para alinearse al nuevo esquema.
- El pool de PostgreSQL ya está configurado con las variables de entorno de `docker-compose.yaml` (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`).

### Alternatives Considered
- *Reescribir las consultas legacy con Prisma ORM*: Rechazado de forma tajante por la Constitución, pues significaría extender la refactorización profunda retrasando la puesta en producción.

---

## 3. Unificación del Token de Autenticación y Middleware de Seguridad

### Decision
1. Enriquecer `LoginQueryHandler` y su DTO de respuesta para retornar `{ token, user: { id, nombre, email, rol, area_id, position_id } }` de modo que `LoginPage.jsx` pueda instanciar la sesión en `localStorage` inmediatamente sin errores.
2. Homogeneizar el middleware de verificación JWT (`backend/src/middlewares/authMiddleware.js`) para que verifique el token utilizando la misma clave secreta (`JWT_SECRET`) y formato de payload (`sub` = ID de usuario en UUID, `roles` = lista de nombres de rol), asignando a `req.user = { id: decoded.sub, rol: decoded.roles[0], ... }`.

### Rationale
- Elimina la incompatibilidad descubierta entre el DTO de login en TS y la expectativa de sesión del frontend.
- Permite que las rutas protegidas del código legacy reconozcan de inmediato al usuario autenticado por el módulo TS sin requerir lógica duplicada.

### Alternatives Considered
- *Crear un endpoint secundario `/api/users/me`*: Rechazado por requerir alterar el flujo de `LoginPage.jsx` y generar llamadas HTTP adicionales innecesarias.

---

## 4. Persistencia de Horarios y Configuración Global

### Decision
Añadir a la base de datos PostgreSQL en Docker las tablas complementarias `horarios`, `horario_detalle` y `configuracion` con clave primaria serial/UUID e inicializarlas con datos predeterminados (jornada institucional de lunes a viernes: 8:00 AM - 12:00 PM y 2:00 PM - 6:00 PM, tolerancia de 15 minutos).

### Rationale
- Satisface la Clarificación 2 acordada.
- Permite que `HorariosPage.jsx` y `ConfiguracionPage.jsx` en el frontend funcionen inmediatamente con persistencia real.

### Alternatives Considered
- *Guardar horarios en archivos JSON locales*: Rechazado por falta de atomicidad transaccional y riesgo de inconsistencia concurrente.

---

## 5. Homogeneización de la Capa de Servicios del Frontend

### Decision
Actualizar las llamadas API en `frontend/src/api/` y en las subcarpetas `features/*/` para asegurar que el prefijo sea homogéneamente `/api/*` y que los parámetros de consulta o nombres de propiedades coincidan con el backend híbrido. No tocar ninguna vista ni componente visual JSX de React.

### Rationale
- Cumple de manera estricta la Directriz Constitucional para el Frontend: "El frontend permanece completamente en JavaScript y no requiere refactorización de la lógica de UI... exclusivamente actualizar la capa de servicios y peticiones (fetch/axios)".
