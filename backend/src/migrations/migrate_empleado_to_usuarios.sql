-- =============================================
-- Migration: Unificar Empleado → Usuario
-- Merge all personal data from empleado into usuarios
-- =============================================
-- Fecha: 2026-07-30
-- Descripción:
--  1. Agrega columnas personales a usuarios
--  2. Migra datos desde empleado
--  3. Crea usuarios para empleados huérfanos (rol_id = 3)
--  4. Migra FKs de tablas hijas (empleado_id → usuario_id)
--  5. Renombra columnas en tablas hijas
--  6. Elimina empleado_id de usuarios
--  7. Elimina tabla empleado
-- =============================================
-- Ejecutar: psql -U <user> -d <db> -f migrate_empleado_to_usuarios.sql
-- =============================================

BEGIN;

-- =============================================
-- STEP 1: Add personal columns to usuarios
-- =============================================
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS cedula VARCHAR(20);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS nombre VARCHAR(100);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS apellido VARCHAR(100);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS correo VARCHAR(255);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS telefono VARCHAR(50);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS fecha_nacimiento DATE;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS cargo_id INTEGER REFERENCES cargos(id);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS area_id INTEGER REFERENCES areas(id);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS horario_id INTEGER REFERENCES horarios(id);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS huella TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS foto TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS tarjeta_rfid VARCHAR(50);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS piso INTEGER;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS fecha_ingreso DATE;

-- =============================================
-- STEP 2: Migrate data from empleado → usuarios
-- Solo para usuarios que ya tienen empleado_id
-- =============================================
UPDATE usuarios u
SET
    cedula           = e.cedula,
    nombre           = e.nombre,
    apellido         = e.apellido,
    correo           = e.correo,
    telefono         = e.telefono,
    fecha_nacimiento = e.fecha_nacimiento,
    cargo_id         = e.cargo_id,
    area_id          = e.area_id,
    horario_id       = e.horario_id,
    huella           = e.huella,
    foto             = e.foto,
    tarjeta_rfid     = e.tarjeta_rfid,
    piso             = e.piso,
    fecha_ingreso    = e.fecha_ingreso
FROM empleado e
WHERE u.empleado_id = e.id;

-- =============================================
-- STEP 3: Handle empleados without linked usuarios
-- Crea usuario con rol_id = 3 (Empleado)
-- Genera username único como 'empleado_<id>'
-- Password temporal: 'Empleado2026!' (bcrypt hash válido abajo)
-- =============================================
INSERT INTO usuarios (
    empleado_id, rol_id, username, password_hash,
    activo, password_reset_required,
    cedula, nombre, apellido, correo, telefono, fecha_nacimiento,
    cargo_id, area_id, horario_id, huella, foto, tarjeta_rfid,
    piso, fecha_ingreso
)
SELECT
    e.id, 3,
    'empleado_' || e.id,
    '$2b$10$JtOUQ2B11EwkqBoea1q1/uisdkId./QwLima0Bmlhc6qO48l7KBVC', true, true,
    e.cedula, e.nombre, e.apellido, e.correo, e.telefono, e.fecha_nacimiento,
    e.cargo_id, e.area_id, e.horario_id, e.huella, e.foto, e.tarjeta_rfid,
    e.piso, e.fecha_ingreso
FROM empleado e
LEFT JOIN usuarios u ON u.empleado_id = e.id
WHERE u.id IS NULL;

-- =============================================
-- STEP 4: Add UNIQUE constraints on cedula and correo
-- Ejecutado después de la migración para evitar
-- conflictos con NULLs durante la inserción
-- =============================================
ALTER TABLE usuarios ADD CONSTRAINT usuarios_cedula_key UNIQUE (cedula);
ALTER TABLE usuarios ADD CONSTRAINT usuarios_correo_key UNIQUE (correo);

-- =============================================
-- STEP 4b: Drop old FK constraints on child tables
-- MUST run BEFORE any remap UPDATE (STEP 5 / STEP 5b):
-- the old FKs reference empleado(id), and the remapped
-- values are usuarios(id) on an independent sequence, so
-- a live NO ACTION FK would raise 23503 and roll back
-- the whole migration on legacy databases.
-- =============================================
ALTER TABLE asistencia DROP CONSTRAINT IF EXISTS asistencia_empleado_id_fkey;
ALTER TABLE incidencias DROP CONSTRAINT IF EXISTS incidencias_empleado_id_fkey;
ALTER TABLE permisos  DROP CONSTRAINT IF EXISTS permisos_empleado_id_fkey;
ALTER TABLE permisos  DROP CONSTRAINT IF EXISTS permisos_solicitado_por_fkey;

-- =============================================
-- STEP 5: Migrate permisos.solicitado_por data
-- Los valores actuales apuntan a empleado(id),
-- se actualizan para apuntar a usuarios(id)
-- =============================================
UPDATE permisos p
SET solicitado_por = u.id
FROM usuarios u
WHERE u.empleado_id = p.solicitado_por;

-- =============================================
-- STEP 5b: Remap child-table values empleado_id -> usuarios.id
-- The old empleado PKs are independent from the usuarios id sequence;
-- without this remap the STEP 8 rename would re-attribute history to wrong users.
-- NOTE: this MUST run before STEP 12 drops usuarios.empleado_id,
--       otherwise the orphan-link used by the UPDATEs no longer exists.
-- =============================================
UPDATE asistencia a SET empleado_id = u.id FROM usuarios u WHERE u.empleado_id = a.empleado_id;
UPDATE incidencias i SET empleado_id = u.id FROM usuarios u WHERE u.empleado_id = i.empleado_id;
UPDATE permisos p SET empleado_id = u.id FROM usuarios u WHERE u.empleado_id = p.empleado_id;

-- =============================================
-- STEP 7: Drop UNIQUE constraint on (empleado_id, fecha)
-- Se recreará más adelante como (usuario_id, fecha)
-- =============================================
ALTER TABLE asistencia DROP CONSTRAINT IF EXISTS asistencia_empleado_id_fecha_key;

-- =============================================
-- STEP 8: Rename columns in child tables
--   asistencia.empleado_id   → usuario_id
--   incidencias.empleado_id   → usuario_id
--   permisos.empleado_id      → usuario_id
--   permisos.solicitado_por   → solicitado_usuario_id
-- =============================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name='asistencia' AND column_name='empleado_id') THEN
        ALTER TABLE asistencia RENAME COLUMN empleado_id TO usuario_id;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name='incidencias' AND column_name='empleado_id') THEN
        ALTER TABLE incidencias RENAME COLUMN empleado_id TO usuario_id;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name='permisos' AND column_name='empleado_id') THEN
        ALTER TABLE permisos RENAME COLUMN empleado_id TO usuario_id;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name='permisos' AND column_name='solicitado_por') THEN
        ALTER TABLE permisos RENAME COLUMN solicitado_por TO solicitado_usuario_id;
    END IF;
END $$;

-- =============================================
-- STEP 9: Re-add FK constraints → usuarios(id)
-- NO ACTION (no CASCADE): deleting a user with history must fail loudly
-- (23503) instead of silently destroying attendance/incidents/permits.
-- =============================================
ALTER TABLE asistencia ADD CONSTRAINT asistencia_usuario_id_fkey
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE NO ACTION;
ALTER TABLE incidencias ADD CONSTRAINT incidencias_usuario_id_fkey
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE NO ACTION;
ALTER TABLE permisos ADD CONSTRAINT permisos_usuario_id_fkey
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE NO ACTION;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name='permisos' AND column_name='solicitado_usuario_id') THEN
        EXECUTE 'ALTER TABLE permisos ADD CONSTRAINT permisos_solicitado_usuario_id_fkey
                 FOREIGN KEY (solicitado_usuario_id) REFERENCES usuarios(id)';
    END IF;
END $$;

-- =============================================
-- STEP 10: Recreate UNIQUE on asistencia (usuario_id, fecha)
-- =============================================
ALTER TABLE asistencia ADD UNIQUE (usuario_id, fecha);

-- =============================================
-- STEP 11: Set NOT NULL on migrated columns
-- Solo si no hay registros con NULLs
-- =============================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM usuarios WHERE nombre IS NULL OR apellido IS NULL) THEN
        ALTER TABLE usuarios ALTER COLUMN nombre SET NOT NULL;
        ALTER TABLE usuarios ALTER COLUMN apellido SET NOT NULL;
    END IF;
END $$;

-- =============================================
-- STEP 12: Drop empleado_id from usuarios
-- =============================================
ALTER TABLE usuarios DROP COLUMN IF EXISTS empleado_id;

-- =============================================
-- STEP 13: Drop empleado table
-- =============================================
DROP TABLE IF EXISTS empleado CASCADE;

-- =============================================
-- STEP 14: Update sequences
-- =============================================
SELECT setval('usuarios_id_seq', COALESCE((SELECT MAX(id) FROM usuarios), 1), true);

COMMIT;
