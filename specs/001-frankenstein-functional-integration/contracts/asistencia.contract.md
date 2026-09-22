# API Contract: Control y Registro de Asistencias

**Base URL**: `/api/asistencia`
**Seguridad**: Todos los endpoints requieren encabezado `Authorization: Bearer <token>`

---

## 1. Listar Registros Diarios (Vista General y Filtros)

- **Método**: `GET`
- **Ruta**: `/`
- **Query Params**:
  - `fecha` (YYYY-MM-DD, opcional, default hoy)
  - `fecha_desde` (YYYY-MM-DD, opcional)
  - `fecha_hasta` (YYYY-MM-DD, opcional)
  - `area` (string, opcional)
  - `piso` (string/number, opcional)
  - `estado` (Puntual / Tardanza / Ausente / Justificado, opcional)
- **Response 200 OK**:
  ```json
  {
    "registros": [
      {
        "id": "c1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
        "empleado_id": "b0026a52-54f4-4266-9a92-c9186506e95a",
        "cedula": "1065123456",
        "empleado": "Jorge Torres",
        "area": "Sistemas",
        "piso": "Piso 2",
        "fecha": "2026-09-22",
        "entrada1": "07:55",
        "salida1": "12:02",
        "entrada2": "14:01",
        "salida2": "18:05",
        "horas_trabajadas": 8.1,
        "minutos_tardanza": 0,
        "estado": "Puntual",
        "tipo_marcacion": "Web"
      }
    ]
  }
  ```

---

## 2. Consultar Historial Personal ("Mi Asistencia")

- **Método**: `GET`
- **Ruta**: `/mi-asistencia`
- **Query Params**:
  - `mes` (1-12)
  - `anio` (YYYY)
- **Response 200 OK**:
  ```json
  {
    "registros": [
      {
        "id": "c1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
        "fecha": "2026-09-22",
        "entrada1": "07:55",
        "salida1": "12:02",
        "entrada2": "14:01",
        "salida2": "18:05",
        "estado": "Puntual",
        "observacion": null
      }
    ]
  }
  ```

---

## 3. Registrar Marcación Manual / Asistida

- **Método**: `POST`
- **Ruta**: `/manual`
- **Request Body**:
  ```json
  {
    "empleado_id": "b0026a52-54f4-4266-9a92-c9186506e95a",
    "fecha": "2026-09-22",
    "entrada1": "08:00",
    "salida1": "12:00",
    "entrada2": "14:00",
    "salida2": "18:00",
    "tipo_marcacion": "Manual",
    "observacion": "Ajuste justificado"
  }
  ```
- **Response 201 Created**:
  ```json
  {
    "mensaje": "Asistencia registrada correctamente",
    "id": "c1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c"
  }
  ```

---

## 4. Justificar Ausencia Directamente en Asistencia

- **Método**: `PUT`
- **Ruta**: `/:id/justificar`
- **Request Body**:
  ```json
  {
    "motivo": "Cita médica programada",
    "tipo": "Permiso"
  }
  ```
- **Response 200 OK**:
  ```json
  {
    "mensaje": "Ausencia justificada correctamente"
  }
  ```
