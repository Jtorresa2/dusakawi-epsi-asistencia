-- =============================================
-- PostgreSQL Schema + Seed — Dusakawi Asistencia
-- =============================================

BEGIN;

-- =============================================
-- SCHEMA
-- =============================================

-- 1. roles
CREATE TABLE IF NOT EXISTS roles (
    id          SERIAL PRIMARY KEY,
    nombre      VARCHAR(100) NOT NULL,
    descripcion VARCHAR(255),
    permisos    JSONB,
    creado_en   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. areas
CREATE TABLE IF NOT EXISTS areas (
    id          SERIAL PRIMARY KEY,
    nombre      VARCHAR(100) NOT NULL UNIQUE,
    piso        INTEGER DEFAULT 1,
    descripcion TEXT DEFAULT '',
    creado_en   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    id                  SERIAL,
    horario_id          INTEGER NOT NULL REFERENCES horarios(id) ON DELETE CASCADE,
    dia_semana          VARCHAR(20) NOT NULL,
    hora_entrada_manana TIME,
    hora_salida_manana  TIME,
    hora_entrada_tarde  TIME,
    hora_salida_tarde   TIME,
    creado_en           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
    huella            TEXT,
    foto              TEXT,
    tarjeta_rfid      VARCHAR(50),
    fecha_ingreso     DATE,
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

-- 8. asistencia
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
    dispositivo_id            VARCHAR(100),
    creado_en                 TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
    id              SERIAL PRIMARY KEY,
    clave           VARCHAR(100) NOT NULL UNIQUE,
    valor           TEXT NOT NULL,
    tipo            VARCHAR(20) NOT NULL,
    creado_en       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
-- SEED DATA — 3 usuarios funcionales
-- =============================================

-- Roles
INSERT INTO roles (id, nombre, descripcion, permisos) VALUES
    (1, 'Administrador', 'Acceso total al sistema', '{"reportes":true,"usuarios":true,"dashboard":true,"empleados":true,"dispositivos":true}'),
    (2, 'Talento Humano', 'Gestión de personal y reportes', '{"reportes":true,"usuarios":false,"dashboard":true,"empleados":true,"dispositivos":false}'),
    (3, 'Empleado', 'Auto-servicio y marcación', '{"reportes":false,"usuarios":false,"dashboard":false,"empleados":false,"dispositivos":false}')
ON CONFLICT (id) DO NOTHING;
SELECT setval('roles_id_seq', 3, true);

-- Areas
INSERT INTO areas (id, nombre, piso, descripcion) VALUES
    (1, 'Sistemas', 3, 'Soporte técnico y sistemas de información'),
    (2, 'Talento Humano', 4, 'Gestión del talento humano'),
    (3, 'Gerencia', 5, 'Gerencia general')
ON CONFLICT (id) DO NOTHING;
SELECT setval('areas_id_seq', 3, true);

-- Cargos
INSERT INTO cargos (id, nombre, descripcion, estado, area_id) VALUES
    (1, 'Gerente General', 'Dirección general de la empresa', 'activo', 3),
    (2, 'Coordinador de Talento Humano', 'Coordinación del equipo de talento humano', 'activo', 2),
    (3, 'Técnico de Sistemas', 'Soporte técnico y mantenimiento de sistemas', 'activo', 1)
ON CONFLICT (id) DO NOTHING;
SELECT setval('cargos_id_seq', 3, true);

-- Horario
INSERT INTO horarios (id, nombre, tolerancia_minutos) VALUES
    (1, 'Administrativo', 5)
ON CONFLICT (id) DO NOTHING;
SELECT setval('horarios_id_seq', 1, true);

-- Horario detalle (Lunes a Viernes)
INSERT INTO horario_detalle (horario_id, dia_semana, hora_entrada_manana, hora_salida_manana, hora_entrada_tarde, hora_salida_tarde) VALUES
    (1, 'Lunes',     '07:00', '12:00', '14:00', '18:00'),
    (1, 'Martes',    '07:00', '12:00', '14:00', '18:00'),
    (1, 'Miércoles', '07:00', '12:00', '14:00', '17:00'),
    (1, 'Jueves',    '07:00', '12:00', '14:00', '17:00'),
    (1, 'Viernes',   '07:00', '12:00', '14:00', '17:00')
ON CONFLICT (horario_id, dia_semana) DO NOTHING;

-- Empleados
INSERT INTO empleado (id, cedula, nombre, apellido, correo, cargo_id, area_id, horario_id, tarjeta_rfid, fecha_ingreso, activo) VALUES
    (1, '10000001', 'Carlos', 'Rodríguez', 'c.rodriguez@dusakawi.com', 1, 3, NULL, 'RFID-001', '2020-01-15', true),
    (2, '10000002', 'María', 'López', 'm.lopez@dusakawi.com', 2, 2, 1, 'RFID-002', '2019-03-10', true),
    (3, '1015995066', 'Juliana', 'Torres', 'torresaaronjuliana@gmail.com', 3, 1, NULL, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
SELECT setval('empleado_id_seq', 3, true);

-- Usuarios (con los password_hash reales de la base original)
INSERT INTO usuarios (id, empleado_id, rol_id, username, password_hash, activo, password_reset_required) VALUES
    (1, 1, 3, 'carlos', '$2b$10$QfVbkqSfSztAqeMBBcIOxuyeCFGxeCa/X3ErYjTvG5YSKbzM5SHvG', true, false),
    (2, 2, 2, 'talento', '$2b$10$FnNwnu0sg.DOrspnoCm91.PVx/HHmKhXM7fUGh6i1mZQLN7JhIVR.', true, false),
    (3, 3, 1, 'Jtorresa22', '$2b$10$UwXojDQlljyPI78khkYz8u4gWCb07lp90pXqS8wf4oqGnYzpptfGu', true, false)
ON CONFLICT (id) DO NOTHING;
SELECT setval('usuarios_id_seq', 3, true);

-- Configuración: motor de base de datos
INSERT INTO configuracion (clave, valor, tipo) VALUES
    ('motor_bd', 'PostgreSQL', 'text')
ON CONFLICT (clave) DO NOTHING;

COMMIT;
