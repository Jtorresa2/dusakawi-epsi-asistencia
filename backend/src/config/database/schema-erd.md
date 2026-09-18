# Dusakawi EPSI — Database Schema (ERD)

```mermaid
erDiagram
    FLOORS ||--o{ AREAS : contains
    FLOORS {
        uuid id PK
        varchar name
        timestamptz created_at
        timestamptz updated_at
    }
    AREAS {
        uuid id PK
        uuid floor_id FK
        varchar name
        text description
        timestamptz created_at
        timestamptz updated_at
    }
    POSITIONS ||--o{ USERS : has
    AREAS ||--o{ POSITIONS : groups
    POSITIONS {
        uuid id PK
        varchar name
        text description
        boolean active
        uuid area_id FK
        timestamptz created_at
        timestamptz updated_at
    }
    AREAS ||--o{ USERS : assigned_to
    USERS {
        uuid id PK
        varchar first_name
        varchar middle_name
        varchar first_surname
        varchar second_surname
        date date_of_birth
        varchar place_of_birth
        varchar address
        varchar phone
        uuid position_id FK
        uuid area_id FK
        uuid schedule_id FK
        varchar username
        varchar password_hash
        varchar email
        boolean active
        boolean password_reset_required
        timestamptz last_access
        text fingerprint
        text photo
        varchar rfc_card
        date hire_date
        timestamptz created_at
        timestamptz updated_at
    }
    ROLES ||--o{ ROLE_ACTIONS : has
    ROLES {
        uuid id PK
        varchar name
        text description
        timestamptz created_at
        timestamptz updated_at
    }
    ACTIONS ||--o{ ROLE_ACTIONS : assigned
    ACTIONS {
        uuid id PK
        varchar name
        text description
        timestamptz created_at
        timestamptz updated_at
    }
    ROLE_ACTIONS {
        uuid role_id PK,FK
        uuid action_id PK,FK
        timestamptz created_at
    }
    USERS ||--o{ USER_ROLES : has
    ROLES ||--o{ USER_ROLES : grants
    USER_ROLES {
        uuid user_id PK,FK
        uuid role_id PK,FK
        timestamptz created_at
    }
    DOCUMENT_TYPES ||--o{ DOCUMENT_DETAILS : types
    DOCUMENT_TYPES {
        uuid id PK
        varchar name
        timestamptz created_at
        timestamptz updated_at
    }
    USERS ||--o| DOCUMENT_DETAILS : owns
    DOCUMENT_DETAILS {
        uuid id PK
        uuid document_type_id FK
        uuid user_id FK
        varchar document_number
        date issue_date
        varchar place_of_issue
        timestamptz created_at
        timestamptz updated_at
    }
    SCHEDULES ||--o{ SCHEDULE_DETAILS : has
    SCHEDULES {
        uuid id PK
        varchar name
        int tolerance_minutes
        int tolerance_departure_minutes
        varchar modality
        varchar workday_type
        text description
        decimal expected_hours
        boolean active
        boolean is_default
        timestamptz created_at
        timestamptz updated_at
    }
    SCHEDULE_DETAILS {
        uuid id PK
        uuid schedule_id FK
        varchar day_of_week
        time morning_entry
        time morning_exit
        time afternoon_entry
        time afternoon_exit
        timestamptz created_at
        timestamptz updated_at
    }
    USERS ||--o{ SCHEDULE_ASSIGNMENTS : assigned
    SCHEDULES ||--o{ SCHEDULE_ASSIGNMENTS : assigned_to
    USERS ||--o{ SCHEDULE_ASSIGNMENTS : "assigned_by"
    SCHEDULE_ASSIGNMENTS {
        uuid id PK
        uuid user_id FK
        uuid schedule_id FK
        date valid_from
        date valid_until
        varchar reason
        uuid assigned_by FK
        timestamptz created_at
        timestamptz updated_at
    }
    USERS ||--o{ ATTENDANCES : registers
    ATTENDANCES {
        uuid id PK
        uuid user_id FK
        date date
        timestamptz entry_timestamp
        timestamptz morning_departure_timestamp
        timestamptz afternoon_entry_timestamp
        timestamptz departure_timestamp
        decimal worked_hours
        decimal extra_hours
        int late_minutes
        varchar mark_type
        varchar status
        varchar mark_state
        text observation
        varchar device_id
        timestamptz created_at
    }
    USERS ||--o{ INCIDENTS : files
    USERS ||--o{ INCIDENTS : reviews
    INCIDENTS {
        uuid id PK
        uuid user_id FK
        varchar type
        text description
        date date
        varchar status
        varchar priority
        text evidence
        text observation
        text rejection_reason
        varchar signed_file
        uuid reviewed_by FK
        timestamptz created_at
        timestamptz updated_at
    }
    USERS ||--o{ NEWS : requests
    USERS ||--o{ NEWS : registers
    USERS ||--o{ NEWS : requested_by
    NEWS {
        uuid id PK
        uuid user_id FK
        date date_from
        date date_to
        text reason
        varchar news_type
        varchar mark_type
        time time_from
        time time_to
        uuid registered_by FK
        varchar status
        varchar request_file
        varchar signed_file
        uuid requested_by_user_id FK
        text rejection_reason
        timestamptz created_at
        timestamptz updated_at
    }
    USERS ||--o{ REQUESTS : creates
    REQUESTS {
        uuid id PK
        uuid user_id FK
        date start_date
        date end_date
        varchar type
        timestamptz created_at
        timestamptz updated_at
    }
    HOLIDAYS {
        uuid id PK
        varchar name
        varchar type
        date date
        boolean active
        timestamptz created_at
        timestamptz updated_at
    }
    USERS ||--o{ PASSWORD_RESET_TOKENS : has
    PASSWORD_RESET_TOKENS {
        uuid id PK
        uuid user_id FK
        varchar token_hash
        timestamp expires_at
        boolean used
        timestamptz created_at
    }
    CONFIG {
        uuid id PK
        varchar key
        text value
        varchar type
        timestamptz created_at
        timestamptz updated_at
    }
    REPORT_HISTORY {
        uuid id PK
        varchar report_type
        varchar user_name
        varchar format
        text filters
        int total_records
        timestamptz generated_at
    }
```

## Relaciones principales

| Tabla | FK | Referencia |
|---|---|---|
| `areas` | `floor_id` | `floors.id` |
| `positions` | `area_id` | `areas.id` (nullable) |
| `users` | `position_id` | `positions.id` |
| `users` | `area_id` | `areas.id` |
| `users` | `schedule_id` | `schedules.id` (cache vía trigger) |
| `role_actions` | `role_id` / `action_id` | `roles.id` / `actions.id` |
| `user_roles` | `user_id` / `role_id` | `users.id` / `roles.id` |
| `document_details` | `document_type_id` / `user_id` | `document_types.id` / `users.id` |
| `schedule_details` | `schedule_id` | `schedules.id` |
| `schedule_assignments` | `user_id` / `schedule_id` / `assigned_by` | `users.id` / `schedules.id` / `users.id` |
| `attendances` | `user_id` | `users.id` |
| `incidents` | `user_id` / `reviewed_by` | `users.id` / `users.id` |
| `news` | `user_id` / `registered_by` / `requested_by_user_id` | `users.id` × 3 |
| `requests` | `user_id` | `users.id` |
| `password_reset_tokens` | `user_id` | `users.id` |

## Triggers

| Trigger | Tabla | Función |
|---|---|---|
| `trg_*_updated_at` | Todas con `updated_at` | Actualiza `updated_at` en cada UPDATE |
| `trg_sync_user_schedule_cache` | `schedule_assignments` | Sincroniza `users.schedule_id` con la asignación vigente |