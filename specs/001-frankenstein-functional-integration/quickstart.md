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
2. **Tablas Complementarias**: Aplicar el script de inicialización para `horarios`, `horario_detalle` y `configuracion` en la base de datos PostgreSQL:
   ```bash
   docker exec -i dusakawi-postgres psql -U postgres -d dusakawi < backend/src/config/database/complementary_tables.sql
   ```
3. **Variables de Entorno**:
   Verificar que `backend/.env` contenga las credenciales correctas:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=postgres
   DB_NAME=dusakawi
   JWT_SECRET=supersecretkey_dusakawi_2026
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
2. Ingresar con las credenciales de administrador (`jtorresa` / contraseña configurada).
3. **Resultado esperado**: Redirección inmediata al dashboard, saludo con el nombre del usuario y visualización de la barra lateral con todas las opciones operativas.

### Escenario 2: Marcación de Asistencia ("Mi Asistencia")
1. Iniciar sesión como empleado o navegar a la sección de marcación.
2. Pulsar sobre el botón de registro de asistencia diaria.
3. **Resultado esperado**: Notificación de éxito en menos de 5 segundos; el registro matutino aparece con la hora actual en la tabla de historial mensual.

### Escenario 3: Radicación y Aprobación de Incidencias
1. Desde la cuenta de empleado, ingresar a "Reportar Incidencia", llenar los campos (tipo Permiso, justificación) y adjuntar un archivo de prueba.
2. Enviar la solicitud.
3. Iniciar sesión como Administrador o Talento Humano, ingresar a la bandeja de "Incidencias", abrir la solicitud pendiente y presionar "Aprobar".
4. **Resultado esperado**: El estado de la incidencia cambia a "Aprobada" y queda registrado el revisor en la base de datos.

### Escenario 4: Horarios y Estructura Organizacional
1. Acceder a "Horarios" como administrador.
2. Modificar la tolerancia o el horario de los viernes y presionar "Guardar".
3. **Resultado esperado**: Mensaje de confirmación y persistencia de los cambios al recargar la página.

### Escenario 5: Generación de Reportes y Exportación PDF
1. Dirigirse al módulo de "Reportes".
2. Seleccionar un rango de fechas y pulsar "Generar Reporte".
3. Pulsar en el botón de descarga "Exportar PDF".
4. **Resultado esperado**: Descarga de un documento PDF oficial con el formato de Dusakawi EPSI conteniendo los registros filtrados.
