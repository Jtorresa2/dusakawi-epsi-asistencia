# Quickstart: Guía de Verificación y Ejecución

**Feature**: `001-frankenstein-functional-integration`
**Fecha**: 2026-09-22

Esta guía describe los pasos necesarios para levantar el entorno completo y verificar el funcionamiento operativo integral del sistema híbrido *Frankenstein Funcional* sin necesidad de suites de pruebas automatizadas (conforme al Principio V de la Constitución).

---

## 1. Prerrequisitos y Preparación del Entorno

1. **Docker y Docker Compose**: Asegurarse de que el contenedor de base de datos esté activo:
   ```bash
   cd backend
   docker compose up -d
   ```
2. **Variables de Entorno**:
   Crear `backend/.env` a mano: el archivo está ignorado por git y **no se
   versiona**, así que un `clone` limpio no lo trae. El backend toma la
   conexión de `DB_URL`; el bloque `DB_HOST`/`DB_PORT`/`DB_USER`/`DB_PASSWORD`/
   `DB_NAME` se lee en `environment.ts` pero Prisma no lo usa:

   ```env
   PORT=5000
   DB_URL=postgresql://postgres:postgres@localhost:5432/dusakawi?schema=asistencia
   JWT_SECRET=supersecretkey_dusakawi_2026
   FRONTEND_URL=http://localhost:5173
   ```

   > **Entorno actual**: el `backend/.env` de esta instalación apunta a la base
   > de datos corporativa de la empresa, no al contenedor local. Docker Compose
   > levanta PostgreSQL para aplicar el DDL y la semilla, pero el backend conecta
   > donde diga `DB_URL`. Apuntarlo al contenedor local es una decisión consciente:
   > sin acceso al ERP, `asistencia.listar_empleados()` devuelve 0 filas por
   > diseño (ver el guard `to_regclass` en `schema.sql`).

3. **Scripts de inicialización**:
   `docker-compose.yaml` monta `schema.sql` y `seed.sql` como
   `01-schema.sql` y `02-seed.sql` en `/docker-entrypoint-initdb.d/`. PostgreSQL
   los ejecuta **solo cuando el volumen está vacío**. Si ya existía un volumen
   con el esqueleto legacy, hay que recrearlo:

   ```bash
   cd backend
   docker compose down -v
   docker compose up -d
   ```

---

## 2. Ejecución del Backend Híbrido

En una terminal:
```bash
cd backend
pnpm install
pnpm dev
```
*Salida esperada*:
```text
Conectado a PostgreSQL
Servidor corriendo en puerto 5000
```

---

## 3. Ejecución del Frontend

En otra terminal:
```bash
cd frontend
npm install
npm run dev # o npm start
```
*Salida esperada*:
Aplicación accesible en `http://localhost:5173` o `http://localhost:3000`.

---

## 4. Escenarios de Verificación Funcional de Extremo a Extremo

### Escenario 1: Autenticación y Carga de Menús
1. Acceder a la página de login.
2. Ingresar con las credenciales creadas por `02-seed.sql`. Los usernames reales
   son `Administrador` y `talento` (verificables con
   `SELECT username FROM asistencia.users;`). No existe un usuario `jtorresa`.
3. **Resultado esperado**: Redirección inmediata al dashboard, saludo con el nombre del usuario y visualización de la barra lateral con las opciones que corresponden al rol.

### Escenario 2: Marcación de Asistencia (marcación manual por Talento Humano)
1. Iniciar sesión como Administrador o Talento Humano.
2. Ir a "Asistencia" (`/asistencia`) y seleccionar al empleado.
3. Registrar la marcación de entrada del día.
4. **Resultado esperado**: La marca aparece en la tabla del día con la hora actual.

   > **Nota**: los empleados son *personas registradas*, no usuarios del portal.
   > `import-empleados-personas.sql` los carga con `is_account = FALSE`, y ninguna
   > ruta de `App.jsx` acepta el rol `empleado`. La marcación la hace TH/admin por
   > el empleado; no hay auto-registro de asistencia por parte del empleado.

### Escenario 3: Novedades Laborales
1. Iniciar sesión como Administrador o Talento Humano.
2. Ir a "Novedades Laborales" (`/novedades`).
3. Crear una novedad y luego editarla.
4. **Resultado esperado**: La novedad queda registrada y visible en el listado.

   > **Nota**: `POST`, `PUT` y `DELETE` de `/api/novedades` están restringidos a
   > `admin` y `talento_humano` (`novedades.routes.ts`). **No hay flujo de
   > aprobación**: no existe endpoint de aprobar/rechazar, y ningún escenario
   > empieza desde una cuenta de empleado. El módulo de Incidencias con
   > "Aprobar/Rechazar" ya no forma parte del sistema.

### Escenario 4: Horarios y Estructura Organizacional
1. Acceder a "Horarios" como administrador.
2. Modificar la tolerancia o el horario de los viernes y presionar "Guardar".
3. **Resultado esperado**: Mensaje de confirmación y persistencia de los cambios al recargar la página.

### Escenario 5: Generación de Reportes y Exportación PDF
1. Dirigirse al módulo de "Reportes".
2. Seleccionar un rango de fechas y pulsar "Generar Reporte".
3. Pulsar en el botón de descarga "Exportar PDF".
4. **Resultado esperado**: Descarga de un documento PDF oficial con el formato de Dusakawi EPSI conteniendo los registros filtrados.
