-- =====================================================================
-- SCHEMA: User, attendance and incident management system
-- Target engine: PostgreSQL
-- Conventions:
--   * All PKs are UUIDs auto-generated (gen_random_uuid())
--   * created_at is auto-generated on insert (DEFAULT now())
--   * updated_at is auto-updated via trigger on every UPDATE
-- =====================================================================

-- ---------------------------------------------------------------------
-- Required extensions (gen_random_uuid)
-- ---------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;

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
    document_number   VARCHAR(50)  NOT NULL,
    issue_date        DATE NOT NULL,
    place_of_issue    VARCHAR(150) NOT NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ,
    CONSTRAINT uq_document_details_document_number UNIQUE (document_number)
);

CREATE INDEX IF NOT EXISTS idx_document_details_document_type_id ON document_details(document_type_id);

CREATE OR REPLACE TRIGGER trg_document_details_updated_at
BEFORE UPDATE ON document_details
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------
-- roles
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,
    description TEXT,
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
    description TEXT,
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
-- area
-- An area belongs to a floor; the same area name can be
-- repeated across different floors, hence the composite UNIQUE.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS area (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    floor_id    UUID NOT NULL REFERENCES floors(id),
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ,
    CONSTRAINT uq_area_name_floor UNIQUE (name, floor_id)
);

CREATE INDEX IF NOT EXISTS idx_area_floor_id ON area(floor_id);

CREATE OR REPLACE TRIGGER trg_area_updated_at
BEFORE UPDATE ON area
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
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_details_id  UUID NOT NULL REFERENCES document_details(id),
    first_name           VARCHAR(100) NOT NULL,
    middle_name          VARCHAR(100),
    first_surname        VARCHAR(100) NOT NULL,
    second_surname       VARCHAR(100) NOT NULL,
    date_of_birth        DATE NOT NULL,
    place_of_birth       VARCHAR(150) NOT NULL,
    address              VARCHAR(255) NOT NULL,
    phone                VARCHAR(20),
    cell                 VARCHAR(20)  NOT NULL,
    position_id          UUID NOT NULL REFERENCES positions(id),
    area_id              UUID NOT NULL REFERENCES area(id),
    username             VARCHAR(50)  NOT NULL,
    password             VARCHAR(255) NOT NULL,
    email                VARCHAR(150) NOT NULL,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ,
    CONSTRAINT uq_users_username UNIQUE (username),
    CONSTRAINT uq_users_email UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS idx_users_document_details_id ON users(document_details_id);
CREATE INDEX IF NOT EXISTS idx_users_position_id ON users(position_id);
CREATE INDEX IF NOT EXISTS idx_users_area_id ON users(area_id);

CREATE OR REPLACE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
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
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id               UUID NOT NULL REFERENCES users(id),
    first_entry_time      TIME,
    last_entry_time       TIME,
    first_departure_time  TIME,
    last_departure_time   TIME,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
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
    status            VARCHAR(50)  NOT NULL,
    priority          VARCHAR(20)  NOT NULL,
    evidence          TEXT,
    observation       TEXT,
    rejection_reason  TEXT,
    signed_file       VARCHAR(255),
    reviewed_by       UUID NOT NULL REFERENCES users(id),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_incidents_user_id ON incidents(user_id);
CREATE INDEX IF NOT EXISTS idx_incidents_reviewed_by ON incidents(reviewed_by);

CREATE OR REPLACE TRIGGER trg_incidents_updated_at
BEFORE UPDATE ON incidents
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Commit the transaction only if all migration statements succeeded.
COMMIT;
