# API Contract: Autenticación y Sesión

**Base URL**: `/api/auth`

---

## 1. Iniciar Sesión

- **Método**: `POST`
- **Ruta**: `/login`
- **Acceso**: Público
- **Request Body**:
  ```json
  {
    "username": "jtorresa",
    "password": "Password123!"
  }
  ```
- **Response 200 OK**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "b0026a52-54f4-4266-9a92-c9186506e95a",
      "username": "jtorresa",
      "nombre": "Jorge Torres",
      "email": "jtorresa@email.com",
      "rol": "Administrador",
      "area_id": "99fedf6e-932b-4ff2-b083-41d74097d978",
      "cargo_id": "456a3915-ed9a-46c2-9ff6-599d9f21ac6d"
    },
    "password_reset_required": false
  }
  ```
- **Response 404 / 401 Unauthorized**:
  ```json
  {
    "status": 404,
    "title": "Not Found",
    "detail": "username or password"
  }
  ```

---

## 2. Registrar Usuario

- **Método**: `POST`
- **Ruta**: `/register`
- **Acceso**: Administrador
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "firstName": "Jorge",
    "middleName": "",
    "firstSurname": "Torres",
    "secondSurname": "Alvarez",
    "dateOfBirth": "1990-05-15",
    "placeOfBirth": "Valledupar",
    "address": "Calle 15 # 10-20",
    "phone": "3001234567",
    "cell": "3001234567",
    "positionId": "UUID",
    "areaId": "UUID",
    "username": "jtorres",
    "email": "jtorres@dusakawi.com",
    "password": "TempPassword123!",
    "roleId": "UUID",
    "documentDetails": {
      "documentTypeId": "UUID",
      "documentNumber": "1065123456",
      "issueDate": "2008-06-20",
      "placeOfIssue": "Valledupar"
    }
  }
  ```
- **Response 201 Created**:
  ```json
  {
    "id": "b0026a52-54f4-4266-9a92-c9186506e95a"
  }
  ```

---

## 3. Cambiar Contraseña

- **Método**: `POST`
- **Ruta**: `/cambiar-password`
- **Acceso**: Usuario Autenticado
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "password_actual": "TempPassword123!",
    "password_nuevo": "NuevaClave2026!"
  }
  ```
- **Response 200 OK**:
  ```json
  {
    "mensaje": "Contraseña actualizada correctamente",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
