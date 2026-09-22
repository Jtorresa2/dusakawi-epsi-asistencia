# API Contract: Gestión de Incidencias y Novedades

**Base URL**: `/api/incidencias` y `/api/novedades`
**Seguridad**: Requieren encabezado `Authorization: Bearer <token>`

---

## 1. Radicar Incidencia / Novedad

- **Método**: `POST`
- **Ruta**: `/`
- **Content-Type**: `multipart/form-data`
- **Form Data**:
  - `tipo`: 'Tardanza' | 'Inasistencia' | 'Permiso' | 'Cita Médica'
  - `descripcion`: texto descriptivo
  - `fecha`: YYYY-MM-DD
  - `evidencia`: archivo adjunto (PDF, JPG, PNG) opcional
- **Response 201 Created**:
  ```json
  {
    "mensaje": "Incidencia reportada correctamente",
    "id": "e4f5a6b7-c8d9-0e1f-2a3b-4c5d6e7f8a9b"
  }
  ```

---

## 2. Listar Incidencias (Bandeja de Revisión)

- **Método**: `GET`
- **Ruta**: `/`
- **Query Params**:
  - `estado`: 'Pendiente' | 'Aprobada' | 'Rechazada'
  - `tipo`: string
  - `fecha_desde`: YYYY-MM-DD
  - `fecha_hasta`: YYYY-MM-DD
- **Comportamiento según rol**:
  - Si `rol === 'empleado'`: retorna únicamente sus propias incidencias radicadas.
  - Si `rol === 'admin'` o `'talento_humano'`: retorna todas las incidencias institucionales.
- **Response 200 OK**:
  ```json
  [
    {
      "id": "e4f5a6b7-c8d9-0e1f-2a3b-4c5d6e7f8a9b",
      "user_id": "b0026a52-54f4-4266-9a92-c9186506e95a",
      "empleado": "Jorge Torres",
      "tipo": "Permiso",
      "descripcion": "Cita médica en EPS Sanitas",
      "status": "Pendiente",
      "priority": "Media",
      "evidence": "/uploads/incidencias/evidencia-123.pdf",
      "created_at": "2026-09-22T08:30:00Z"
    }
  ]
  ```

---

## 3. Aprobar Incidencia

- **Método**: `PUT`
- **Ruta**: `/:id/aprobar`
- **Acceso**: Administrador / Talento Humano
- **Request Body**:
  ```json
  {
    "observacion": "Permiso aprobado conforme certificado"
  }
  ```
- **Response 200 OK**:
  ```json
  {
    "mensaje": "Incidencia aprobada"
  }
  ```

---

## 4. Rechazar Incidencia

- **Método**: `PUT`
- **Ruta**: `/:id/rechazar`
- **Acceso**: Administrador / Talento Humano
- **Request Body**:
  ```json
  {
    "motivo": "Falta soporte de la EPS"
  }
  ```
- **Response 200 OK**:
  ```json
  {
    "mensaje": "Incidencia rechazada"
  }
  ```
