-- =====================================================================
-- SCHEMA: User, attendance and incident management system
-- Target engine: PostgreSQL
-- Conventions:
--   * All objects live in the "asistencia" schema, not in public
--   * All PKs are UUIDs auto-generated (gen_random_uuid())
--   * created_at is auto-generated on insert (DEFAULT now())
--   * updated_at is auto-updated via trigger on every UPDATE
-- =====================================================================

-- ---------------------------------------------------------------------
-- Project schema: keeps the shared "public" schema clean
-- ---------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS asistencia;

-- Everything unqualified below is created inside "asistencia": the
-- search_path targets it first, so tables, functions, triggers, indexes
-- and constraints NEVER write into other schemas. "public" stays in the
-- path only so pre-installed shared objects (extensions like pgcrypto)
-- remain resolvable by name; nothing declared here lands in public.
SET search_path TO asistencia, public;

-- ---------------------------------------------------------------------
-- Required extensions (gen_random_uuid)
-- Explicitly installed into "asistencia" so nothing touches public.
-- If pgcrypto is already present elsewhere in this database, this
-- statement becomes a no-op and the existing copy keeps resolving
-- through the search_path above.
-- ---------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA asistencia;

-- ---------------------------------------------------------------------
-- Generic function to update updated_at on every UPDATE
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Start migration in a single transaction. Any failure will abort before commit.
BEGIN;

-- =====================================================================
-- TABLES WITHOUT DEPENDENCIES (or with minimal dependencies)
-- =====================================================================

-- ---------------------------------------------------------------------
-- roles
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ,
    CONSTRAINT uq_roles_name UNIQUE (name)
);

CREATE OR REPLACE TRIGGER trg_roles_updated_at
BEFORE UPDATE ON roles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------
-- actions
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS actions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ,
    CONSTRAINT uq_actions_name UNIQUE (name)
);

CREATE OR REPLACE TRIGGER trg_actions_updated_at
BEFORE UPDATE ON actions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------
-- role_actions (bridge table roles <-> actions)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS role_actions (
    role_id    UUID NOT NULL REFERENCES roles(id)   ON DELETE CASCADE,
    action_id  UUID NOT NULL REFERENCES actions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (role_id, action_id)
);

-- ---------------------------------------------------------------------
-- positions
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS positions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    active      BOOLEAN NOT NULL DEFAULT TRUE,
    area_id     UUID,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ,
    CONSTRAINT uq_positions_name UNIQUE (name)
);

CREATE OR REPLACE TRIGGER trg_positions_updated_at
BEFORE UPDATE ON positions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------
-- floors
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS floors (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ,
    CONSTRAINT uq_floors_name UNIQUE (name)
);

CREATE OR REPLACE TRIGGER trg_floors_updated_at
BEFORE UPDATE ON floors
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------
-- areas
-- An area belongs to a floor; the same area name can be
-- repeated across different floors, hence the composite UNIQUE.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS areas (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    floor_id    UUID NOT NULL REFERENCES floors(id),
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ,
    CONSTRAINT uq_area_name_floor UNIQUE (name, floor_id)
);

CREATE INDEX IF NOT EXISTS idx_area_floor_id ON areas(floor_id);

CREATE OR REPLACE TRIGGER trg_areas_updated_at
BEFORE UPDATE ON areas
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------
-- holidays (independent table)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS holidays (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       VARCHAR(150) NOT NULL,
    type       VARCHAR(50)  NOT NULL,
    date       DATE NOT NULL,
    active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ
);

CREATE OR REPLACE TRIGGER trg_holidays_updated_at
BEFORE UPDATE ON holidays
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =====================================================================
-- USERS AND DEPENDENT TABLES
-- =====================================================================

-- ---------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name               VARCHAR(100) NOT NULL,
    middle_name              VARCHAR(100),
    first_surname            VARCHAR(100) NOT NULL,
    second_surname           VARCHAR(100),
    date_of_birth            DATE NOT NULL,
    place_of_birth           VARCHAR(150) NOT NULL,
    address                  VARCHAR(255) NOT NULL,
phone                    VARCHAR(20),
    position_id              UUID NOT NULL REFERENCES positions(id),
    area_id                  UUID NOT NULL REFERENCES areas(id),
    schedule_id              UUID,
    username                 VARCHAR(50)  NOT NULL,
    password_hash            VARCHAR(255) NOT NULL,
    email                    VARCHAR(150) NOT NULL,
    active                   BOOLEAN NOT NULL DEFAULT TRUE,
    password_reset_required  BOOLEAN NOT NULL DEFAULT TRUE,
    last_access              TIMESTAMPTZ,
    fingerprint              TEXT,
    photo                    TEXT,
    rfc_card                 VARCHAR(50),
    hire_date                DATE,
    created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at               TIMESTAMPTZ,
    CONSTRAINT uq_users_username UNIQUE (username),
    CONSTRAINT uq_users_email UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS idx_users_position_id ON users(position_id);
CREATE INDEX IF NOT EXISTS idx_users_area_id ON users(area_id);
CREATE INDEX IF NOT EXISTS idx_users_schedule_id ON users(schedule_id);

CREATE OR REPLACE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------
-- document_types
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS document_types (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ,
    CONSTRAINT uq_document_types_name UNIQUE (name)
);

CREATE OR REPLACE TRIGGER trg_document_types_updated_at
BEFORE UPDATE ON document_types
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------
-- document_details
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS document_details (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_type_id  UUID NOT NULL REFERENCES document_types(id),
    user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_number   VARCHAR(50)  NOT NULL,
    issue_date        DATE NOT NULL,
    place_of_issue    VARCHAR(150) NOT NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ,
    CONSTRAINT uq_document_details_document_number UNIQUE (document_number),
    CONSTRAINT uq_document_details_user_id UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_document_details_document_type_id ON document_details(document_type_id);

CREATE OR REPLACE TRIGGER trg_document_details_updated_at
BEFORE UPDATE ON document_details
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------
-- user_roles (bridge table users <-> roles)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_roles (
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id    UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, role_id)
);

-- ---------------------------------------------------------------------
-- requests
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS requests (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID REFERENCES users(id),
    start_date DATE NOT NULL,
    end_date   DATE NOT NULL,
    type       VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_requests_user_id ON requests(user_id);

CREATE OR REPLACE TRIGGER trg_requests_updated_at
BEFORE UPDATE ON requests
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------
-- attendances
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS attendances (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                     UUID NOT NULL REFERENCES users(id),
    date                        DATE NOT NULL,
    entry_timestamp             TIMESTAMPTZ,
    morning_departure_timestamp TIMESTAMPTZ,
    afternoon_entry_timestamp   TIMESTAMPTZ,
    departure_timestamp         TIMESTAMPTZ,
    worked_hours                DECIMAL(5,2),
    extra_hours                 DECIMAL(5,2),
    late_minutes                INTEGER,
    mark_type                   VARCHAR(50),
    status                      VARCHAR(20) NOT NULL DEFAULT 'on_time',
    mark_state                  VARCHAR(20) NOT NULL DEFAULT 'open',
    observation                 TEXT,
    device_id                   VARCHAR(100),
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_attendances_user_id ON attendances(user_id);

-- ---------------------------------------------------------------------
-- incidents
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS incidents (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID NOT NULL REFERENCES users(id),
    type              VARCHAR(50)  NOT NULL,
    description       TEXT NOT NULL,
    date              DATE NOT NULL,
    status            VARCHAR(50)  NOT NULL,
    priority          VARCHAR(20)  NOT NULL,
    evidence          TEXT,
    observation       TEXT,
    rejection_reason  TEXT,
    signed_file       VARCHAR(255),
    reviewed_by       UUID REFERENCES users(id),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_incidents_user_id ON incidents(user_id);
CREATE INDEX IF NOT EXISTS idx_incidents_reviewed_by ON incidents(reviewed_by);

CREATE OR REPLACE TRIGGER trg_incidents_updated_at
BEFORE UPDATE ON incidents
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =====================================================================
-- SCHEDULES
-- =====================================================================

-- ---------------------------------------------------------------------
-- schedules (work schedules / horarios)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS schedules (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                        VARCHAR(100) NOT NULL,
    tolerance_minutes           INTEGER NOT NULL DEFAULT 0,
    tolerance_departure_minutes INTEGER NOT NULL DEFAULT 0,
    modality                    VARCHAR(20) NOT NULL DEFAULT 'strict'
                                CHECK (modality IN ('strict', 'flexible')),
    workday_type                VARCHAR(20) NOT NULL DEFAULT 'fixed'
                                CHECK (workday_type IN ('fixed', 'by_hours')),
    description                 TEXT,
    expected_hours              DECIMAL(4,2),
    active                      BOOLEAN NOT NULL DEFAULT TRUE,
    is_default                  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ,
    CONSTRAINT uq_schedules_name UNIQUE (name)
);

CREATE OR REPLACE TRIGGER trg_schedules_updated_at
BEFORE UPDATE ON schedules
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------
-- schedule_details (daily breakdown per schedule)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS schedule_details (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id       UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
    day_of_week       VARCHAR(20) NOT NULL,
    morning_entry     TIME,
    morning_exit      TIME,
    afternoon_entry   TIME,
    afternoon_exit    TIME,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ,
    CONSTRAINT uq_schedule_details_schedule_day UNIQUE (schedule_id, day_of_week)
);

CREATE INDEX IF NOT EXISTS idx_schedule_details_schedule_id ON schedule_details(schedule_id);

CREATE OR REPLACE TRIGGER trg_schedule_details_updated_at
BEFORE UPDATE ON schedule_details
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------
-- schedule_assignments (user <-> schedule with validity period)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS schedule_assignments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    schedule_id     UUID NOT NULL REFERENCES schedules(id),
    valid_from      DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_until     DATE,
    reason          VARCHAR(255),
    assigned_by     UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_schedule_assignments_user_id ON schedule_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_schedule_assignments_schedule_id ON schedule_assignments(schedule_id);

CREATE OR REPLACE TRIGGER trg_schedule_assignments_updated_at
BEFORE UPDATE ON schedule_assignments
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------
-- Trigger: sync schedule cache on users from assignments
-- Keeps users.schedule_id in sync with the latest active assignment.
-- Table references inside the body are schema-qualified so the trigger
-- always operates on "asistencia" regardless of the caller's search_path.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sync_user_schedule_cache()
RETURNS TRIGGER AS $$
DECLARE
    uid UUID;
BEGIN
    uid := COALESCE(NEW.user_id, OLD.user_id);
    UPDATE asistencia.users u
    SET schedule_id = (
        SELECT a.schedule_id
        FROM asistencia.schedule_assignments a
        WHERE a.user_id = uid
          AND a.valid_from <= CURRENT_DATE
          AND (a.valid_until IS NULL OR a.valid_until > CURRENT_DATE)
        ORDER BY a.valid_from DESC, a.id DESC
        LIMIT 1
    )
    WHERE u.id = uid;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_user_schedule_cache ON schedule_assignments;
CREATE TRIGGER trg_sync_user_schedule_cache
AFTER INSERT OR UPDATE OR DELETE ON schedule_assignments
FOR EACH ROW EXECUTE FUNCTION sync_user_schedule_cache();

-- =====================================================================
-- NEWS (laboral news / novedades)
-- =====================================================================

-- ---------------------------------------------------------------------
-- news (permissions, vacations, sick leave, etc.)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS news (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                UUID NOT NULL REFERENCES users(id),
    date_from              DATE NOT NULL,
    date_to                DATE NOT NULL,
    reason                 TEXT NOT NULL,
    news_type              VARCHAR(30) NOT NULL DEFAULT 'permission'
                           CHECK (news_type IN ('permission', 'vacation', 'sick_leave',
                                                'commission', 'license', 'suspension')),
    mark_type              VARCHAR(20) NOT NULL DEFAULT 'full_day'
                           CHECK (mark_type IN ('full_day', 'hours', 'morning', 'afternoon')),
    time_from              TIME,
    time_to                TIME,
    registered_by          UUID REFERENCES users(id),
    status                 VARCHAR(20) NOT NULL DEFAULT 'approved'
                           CHECK (status IN ('pending', 'approved', 'rejected')),
    request_file           VARCHAR(500),
    signed_file            VARCHAR(500),
    requested_by_user_id   UUID REFERENCES users(id),
    rejection_reason       TEXT,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at             TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_news_user_id ON news(user_id);

CREATE OR REPLACE TRIGGER trg_news_updated_at
BEFORE UPDATE ON news
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =====================================================================
-- PASSWORD RESET
-- =====================================================================

-- ---------------------------------------------------------------------
-- password_reset_tokens
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(64) NOT NULL,
    expires_at  TIMESTAMP NOT NULL,
    used        BOOLEAN NOT NULL DEFAULT FALSE,
    used_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_password_reset_tokens_hash UNIQUE (token_hash)
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);

-- =====================================================================
-- SYSTEM CONFIGURATION
-- =====================================================================

-- ---------------------------------------------------------------------
-- config (key-value system settings)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS config (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key         VARCHAR(100) NOT NULL,
    value       TEXT NOT NULL,
    type        VARCHAR(20) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ,
    CONSTRAINT uq_config_key UNIQUE (key)
);

CREATE OR REPLACE TRIGGER trg_config_updated_at
BEFORE UPDATE ON config
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =====================================================================
-- REPORT HISTORY
-- =====================================================================

-- ---------------------------------------------------------------------
-- report_history (log of generated reports)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS report_history (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_type      VARCHAR(100) NOT NULL,
    user_name        VARCHAR(255) NOT NULL,
    format           VARCHAR(20),
    filters          TEXT,
    total_records    INTEGER DEFAULT 0,
    generated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Commit the transaction only if all migration statements succeeded.
COMMIT;
