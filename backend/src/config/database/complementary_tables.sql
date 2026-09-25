-- =====================================================================
-- TABLAS COMPLEMENTARIAS: horarios, horario_detalle y configuracion
-- Target engine: PostgreSQL
-- =====================================================================

BEGIN;

-- 1. horarios
CREATE TABLE IF NOT EXISTS horarios (
    id                 SERIAL PRIMARY KEY,
    nombre             VARCHAR(100) NOT NULL,
    tolerancia_minutos INTEGER DEFAULT 15,
    creado_en          TIMESTAMPTZ DEFAULT now()
);

-- 2. horario_detalle
CREATE TABLE IF NOT EXISTS horario_detalle (
    id                  SERIAL PRIMARY KEY,
    horario_id          INTEGER NOT NULL REFERENCES horarios(id) ON DELETE CASCADE,
    dia_semana          VARCHAR(20) NOT NULL,
    hora_entrada_manana TIME,
    hora_salida_manana   TIME,
    hora_entrada_tarde  TIME,
    hora_salida_tarde   TIME
);

-- 3. configuracion
CREATE TABLE IF NOT EXISTS configuracion (
    id             SERIAL PRIMARY KEY,
    clave          VARCHAR(100) NOT NULL UNIQUE,
    valor          TEXT NOT NULL,
    tipo           VARCHAR(20) DEFAULT 'text',
    actualizado_en TIMESTAMPTZ DEFAULT now()
);

-- 4. attendances extensiones de compatibilidad
ALTER TABLE attendances ADD COLUMN IF NOT EXISTS estado VARCHAR(50) DEFAULT 'puntual';
ALTER TABLE attendances ADD COLUMN IF NOT EXISTS observacion TEXT;
ALTER TABLE attendances ADD COLUMN IF NOT EXISTS tipo_marcacion VARCHAR(50) DEFAULT 'Web';
ALTER TABLE attendances ADD COLUMN IF NOT EXISTS minutos_tardanza INTEGER DEFAULT 0;
ALTER TABLE attendances ADD COLUMN IF NOT EXISTS horas_trabajadas NUMERIC(4,2) DEFAULT 0;
ALTER TABLE attendances ADD COLUMN IF NOT EXISTS horas_extra NUMERIC(4,2) DEFAULT 0;

-- =====================================================================
-- DATOS SEMILLA (SEED)
-- =====================================================================

-- Semilla de Horario Institucional
INSERT INTO horarios (id, nombre, tolerancia_minutos)
VALUES (1, 'Horario General Dusakawi', 15)
ON CONFLICT (id) DO NOTHING;

-- Semilla de Detalle de Horario (Lunes a Viernes jornada partida, Sábado mañana)
INSERT INTO horario_detalle (horario_id, dia_semana, hora_entrada_manana, hora_salida_manana, hora_entrada_tarde, hora_salida_tarde)
SELECT 1, d.dia, d.em, d.sm, d.et, d.st
FROM (VALUES 
    ('Lunes',     '08:00:00'::TIME, '12:00:00'::TIME, '14:00:00'::TIME, '18:00:00'::TIME),
    ('Martes',    '08:00:00'::TIME, '12:00:00'::TIME, '14:00:00'::TIME, '18:00:00'::TIME),
    ('Miércoles', '08:00:00'::TIME, '12:00:00'::TIME, '14:00:00'::TIME, '18:00:00'::TIME),
    ('Jueves',    '08:00:00'::TIME, '12:00:00'::TIME, '14:00:00'::TIME, '18:00:00'::TIME),
    ('Viernes',   '08:00:00'::TIME, '12:00:00'::TIME, '14:00:00'::TIME, '18:00:00'::TIME),
    ('Sábado',    '08:00:00'::TIME, '12:00:00'::TIME, NULL,            NULL),
    ('Domingo',   NULL,             NULL,             NULL,            NULL)
) AS d(dia, em, sm, et, st)
WHERE NOT EXISTS (SELECT 1 FROM horario_detalle WHERE horario_id = 1);

-- 5. Migración: empleados sin credenciales de acceso
-- username y password_hash pasan a NULLABLE (el empleado no tiene cuenta de acceso)
ALTER TABLE users ALTER COLUMN username DROP NOT NULL;
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Semilla de Configuración Institucional
INSERT INTO configuracion (clave, valor, tipo)
VALUES 
    ('nombre_institucion', 'DUSAKAWI EPSI', 'text'),
    ('tolerancia_minutos', '15', 'number'),
    ('hora_inicio_laboral', '08:00', 'text'),
    ('hora_fin_laboral', '18:00', 'text'),
    ('permitir_marcacion_web', 'true', 'boolean'),
    ('email_notificaciones', 'talento@dusakawi.com', 'text')
ON CONFLICT (clave) DO NOTHING;

COMMIT;
