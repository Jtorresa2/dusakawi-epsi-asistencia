# API Contract: Gestión de Empleados y Usuarios

**Base URL**: `/api/users` y `/api/empleados`
**Seguridad**: Requieren encabezado `Authorization: Bearer <token>`

---

## 1. Listar Empleados (`/api/empleados`)

Adaptador de servicio que consulta la tabla `users` con sus relaciones de documento, cargo y área.

- **Método**: `GET`
- **Ruta**: `/api/empleados`
- **Query Params**:
  - `area` (UUID o nombre de área, opcional)
  - `cargo` (UUID o nombre de cargo, opcional)
- **Response 200 OK**:
  ```json
  {
    "empleados": [
      {
        "id": "b0026a52-54f4-4266-9a92-c9186506e95a",
        "cedula": "1065123456",
        "nombre": "Jorge",
        "apellido": "Torres",
        "email": "jtorresa@email.com",
        "telefono": "3001234567",
        "cargo": "Ingeniero de Sistemas",
        "cargo_id": "456a3915-ed9a-46c2-9ff6-599d9f21ac6d",
        "area": "Tecnología",
        "area_id": "99fedf6e-932b-4ff2-b083-41d74097d978",
        "piso": "Piso 2",
        "estado": "activo"
      }
    ]
  }
  ```

---

## 2. Detalle de Usuario Refactorizado (`/api/users/:id`)

Endpoint nativo TypeScript que expone el detalle de usuario completo.

- **Método**: `GET`
- **Ruta**: `/api/users/:id`
- **Response 200 OK**:
  ```json
  {
    "id": "b0026a52-54f4-4266-9a92-c9186506e95a",
    "firstName": "Jorge",
    "middleName": "",
    "firstSurname": "Torres",
    "secondSurname": "Alvarez",
    "email": "jtorresa@email.com",
    "username": "jtorresa",
    "dateOfBirth": "1990-05-15",
    "placeOfBirth": "Valledupar",
    "address": "Calle 15 # 10-20",
    "phone": "3001234567",
    "cell": "3001234567",
    "positionId": "456a3915-ed9a-46c2-9ff6-599d9f21ac6d",
    "areaId": "99fedf6e-932b-4ff2-b083-41d74097d978",
    "roles": ["Administrador"]
  }
  ```

---

## 3. Actualizar Datos de Empleado / Usuario

- **Método**: `PUT`
- **Rutas soportadas**: `/api/empleados/:id` o `/api/users/:id`
- **Response 200 OK**:
  ```json
  {
    "mensaje": "Empleado actualizado correctamente"
  }
  ```
