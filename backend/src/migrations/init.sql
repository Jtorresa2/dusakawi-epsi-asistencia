-- =============================================
-- PostgreSQL Schema — Dusakawi Asistencia
-- =============================================

BEGIN;

-- 1. roles
CREATE TABLE IF NOT EXISTS roles (
    id          SERIAL PRIMARY KEY,
    nombre      VARCHAR(100) NOT NULL,
    descripcion VARCHAR(255)
);

-- 2. areas
CREATE TABLE IF NOT EXISTS areas (
    id          SERIAL PRIMARY KEY,
    nombre      VARCHAR(100) NOT NULL UNIQUE,
    piso        INTEGER DEFAULT 1,
    descripcion TEXT DEFAULT ''
);

-- 3. cargos
CREATE TABLE IF NOT EXISTS cargos (
    id          SERIAL PRIMARY KEY,
    nombre      VARCHAR(100) NOT NULL,
    descripcion TEXT,
    estado      VARCHAR(20) DEFAULT 'activo',
    creado_en   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    area_id     INTEGER REFERENCES areas(id)
);

-- 4. horarios
CREATE TABLE IF NOT EXISTS horarios (
    id                SERIAL PRIMARY KEY,
    nombre            VARCHAR(100) NOT NULL,
    tolerancia_minutos INTEGER DEFAULT 0,
    creado_en         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. horario_detalle
CREATE TABLE IF NOT EXISTS horario_detalle (
    horario_id          INTEGER NOT NULL REFERENCES horarios(id) ON DELETE CASCADE,
    dia_semana          VARCHAR(20) NOT NULL,
    hora_entrada_manana TIME,
    hora_salida_manana  TIME,
    hora_entrada_tarde  TIME,
    hora_salida_tarde   TIME,
    PRIMARY KEY (horario_id, dia_semana)
);

-- 6. empleado
CREATE TABLE IF NOT EXISTS empleado (
    id                SERIAL PRIMARY KEY,
    cedula            VARCHAR(20) NOT NULL UNIQUE,
    nombre            VARCHAR(100) NOT NULL,
    apellido          VARCHAR(100) NOT NULL,
    correo            VARCHAR(255) UNIQUE,
    telefono          VARCHAR(50),
    fecha_nacimiento  DATE,
    cargo_id          INTEGER REFERENCES cargos(id),
    area_id           INTEGER REFERENCES areas(id),
    horario_id        INTEGER REFERENCES horarios(id),
    activo            BOOLEAN DEFAULT TRUE,
    creado_en         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id                     SERIAL PRIMARY KEY,
    empleado_id            INTEGER NOT NULL REFERENCES empleado(id),
    rol_id                 INTEGER NOT NULL REFERENCES roles(id),
    username               VARCHAR(255) NOT NULL UNIQUE,
    password_hash          VARCHAR(255) NOT NULL,
    activo                 BOOLEAN DEFAULT TRUE,
    password_reset_required BOOLEAN DEFAULT TRUE,
    ultimo_acceso          TIMESTAMP,
    creado_en              TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. asistencia (UNIQUE empleado_id + fecha)
CREATE TABLE IF NOT EXISTS asistencia (
    id                        SERIAL PRIMARY KEY,
    empleado_id               INTEGER NOT NULL REFERENCES empleado(id),
    fecha                     DATE NOT NULL,
    fecha_hora_entrada        TIMESTAMP,
    fecha_hora_salida_manana  TIMESTAMP,
    fecha_hora_entrada_tarde  TIMESTAMP,
    fecha_hora_salida         TIMESTAMP,
    horas_trabajadas          DECIMAL(5,2),
    horas_extra               DECIMAL(5,2),
    minutos_tardanza          INTEGER,
    tipo_marcacion            VARCHAR(50),
    estado                    VARCHAR(20) NOT NULL DEFAULT 'puntual',
    observacion               TEXT,
    UNIQUE (empleado_id, fecha)
);

-- 9. incidencias
CREATE TABLE IF NOT EXISTS incidencias (
    id              SERIAL PRIMARY KEY,
    empleado_id     INTEGER NOT NULL REFERENCES empleado(id),
    tipo            VARCHAR(100) NOT NULL,
    descripcion     TEXT,
    evidencia_url   VARCHAR(500),
    archivo_firmado VARCHAR(500),
    fecha           DATE NOT NULL,
    estado          VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    prioridad       VARCHAR(20),
    motivo_rechazo  TEXT,
    observacion     TEXT,
    revisado_por    INTEGER REFERENCES usuarios(id),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. configuracion
CREATE TABLE IF NOT EXISTS configuracion (
    id    SERIAL PRIMARY KEY,
    clave VARCHAR(100) NOT NULL UNIQUE,
    valor TEXT NOT NULL,
    tipo  VARCHAR(20) NOT NULL
);

-- 11. permisos
CREATE TABLE IF NOT EXISTS permisos (
    id              SERIAL PRIMARY KEY,
    empleado_id     INTEGER NOT NULL REFERENCES empleado(id),
    fecha_desde     DATE NOT NULL,
    fecha_hasta     DATE NOT NULL,
    motivo          TEXT NOT NULL,
    tipo            VARCHAR(20) NOT NULL DEFAULT 'completo',
    registrado_por  INTEGER REFERENCES usuarios(id),
    creado_en       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. reportes_historial
CREATE TABLE IF NOT EXISTS reportes_historial (
    id               SERIAL PRIMARY KEY,
    tipo_reporte     VARCHAR(100) NOT NULL,
    usuario_nombre   VARCHAR(255) NOT NULL,
    formato          VARCHAR(20),
    filtros          TEXT,
    total_registros  INTEGER DEFAULT 0,
    fecha_generacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- Seed data
-- =============================================

INSERT INTO roles (nombre, descripcion) VALUES
    ('Administrador', 'Acceso total al sistema'),
    ('Talento Humano', 'Gestión de personal y reportes'),
    ('Empleado', 'Auto-servicio y marcación')
ON CONFLICT (id) DO NOTHING;

COMMIT;
