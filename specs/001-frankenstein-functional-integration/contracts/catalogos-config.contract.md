# API Contract: Catálogos Maestros y Configuración

**Seguridad**: Rutas protegidas mediante `Authorization: Bearer <token>`

---

## 1. Áreas y Pisos (Refactorizado TS)

- **GET** `/api/areas`: Retorna la lista de áreas con su piso respectivo.
- **POST** `/api/areas`: Crea una nueva área asociada a un piso (`floorId`, `name`, `description`).
- **PUT** `/api/areas/:id`: Actualiza un área.
- **DELETE** `/api/areas/:id`: Elimina un área.
- **GET** `/api/floors`: Retorna los pisos registrados en la entidad.

---

## 2. Cargos (`/api/cargos` operando sobre `positions`)

- **GET** `/api/cargos`:
  ```json
  [
    {
      "id": "456a3915-ed9a-46c2-9ff6-599d9f21ac6d",
      "nombre": "Ingeniero de Sistemas",
      "descripcion": "Gestión de plataformas tecnológicas"
    }
  ]
  ```
- **POST** `/api/cargos`: Crea un nuevo cargo (`nombre`, `descripcion`).
- **PUT** `/api/cargos/:id`: Actualiza un cargo.
- **DELETE** `/api/cargos/:id`: Elimina un cargo (valida restricción de integridad referencial).

---

## 3. Festivos (`/api/festivos` operando sobre `holidays`)

- **GET** `/api/festivos`: Retorna la lista de días festivos del año.
  ```json
  [
    {
      "id": "UUID",
      "nombre": "Día de la Independencia",
      "fecha": "2026-07-20",
      "tipo": "Nacional",
      "activo": true
    }
  ]
  ```
- **POST** `/api/festivos`: Registra un día festivo (`nombre`, `fecha`, `tipo`).
- **DELETE** `/api/festivos/:id`: Elimina o desactiva un festivo.

---

## 4. Horarios y Tolerancias (`/api/horarios`)

- **GET** `/api/horarios`: Retorna el catálogo de horarios y el detalle de los 7 días de la semana con horas matutinas y vespertinas.
- **GET** `/api/horarios/:id`: Detalle del horario y sus días.
- **PUT** `/api/horarios/:id`: Actualiza nombre, tolerancia en minutos y rangos de horas por día.

---

## 5. Configuración del Sistema (`/api/config`)

- **GET** `/api/config`: Retorna el mapa clave-valor de configuración (`{ "tolerancia_minutos": 15, "nombre_institucion": "DUSAKAWI EPSI" }`).
- **PUT** `/api/config`: Guarda/actualiza parámetros de configuración.
