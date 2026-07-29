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
    tipo            VARCHAR(20) NOT NULL DEFAULT 'completo'
                    CHECK (tipo IN ('completo', 'mañana', 'tarde', 'horas', 'comision')),
    hora_desde      TIME,
    hora_hasta      TIME,
    registrado_por  INTEGER REFERENCES usuarios(id),
    estado          VARCHAR(20) NOT NULL DEFAULT 'aprobado'
                    CHECK (estado IN ('pendiente', 'aprobado', 'rechazado')),
    archivo_solicitud VARCHAR(500),
    archivo_firmado   VARCHAR(500),
    solicitado_por  INTEGER REFERENCES empleado(id),
    motivo_rechazo  TEXT,
    creado_en       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. festivos
CREATE TABLE IF NOT EXISTS festivos (
    id         SERIAL PRIMARY KEY,
    fecha      DATE NOT NULL UNIQUE,
    nombre     VARCHAR(200) NOT NULL,
    tipo       VARCHAR(50) NOT NULL DEFAULT 'nacional'
               CHECK (tipo IN ('nacional', 'regional', 'institucional')),
    activo     BOOLEAN DEFAULT TRUE,
    creado_en  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. reportes_historial
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

-- Areas (35 áreas operativas)
INSERT INTO areas (id, nombre, piso, descripcion) VALUES
    (1, 'SIAU', 1, 'Sistema de Información y Atención al Usuario'),
    (2, 'PQR', 1, 'Peticiones, Quejas y Reclamos'),
    (3, 'Call Center', 1, 'Centro de atención telefónica'),
    (4, 'Autorizaciones', 1, 'Gestión de autorizaciones médicas'),
    (5, 'Aseguramiento', 1, 'Gestión de aseguramiento en salud'),
    (6, 'Psicología', 1, 'Servicios de psicología'),
    (7, 'Recepción', 1, 'Recepción y atención al usuario'),
    (8, 'Transporte', 1, 'Gestión de transporte de pacientes'),
    (9, 'MIPRES', 1, 'Prescripción de medicamentos y servicios'),
    (10, 'Portabilidad', 1, 'Gestión de portabilidad'),
    (11, 'Referencia', 1, 'Referencia y contrarreferencia'),
    (12, 'Auditoría de Cuentas Médicas', 2, 'Auditoría y control de cuentas médicas'),
    (13, 'Radicación', 2, 'Radicación de documentos'),
    (14, 'Archivo', 2, 'Gestión documental y archivo'),
    (15, 'SARLAFT', 2, 'Sistema de Administración del Riesgo de Lavado de Activos'),
    (16, 'Contabilidad', 3, 'Gestión contable'),
    (17, 'Presupuesto', 3, 'Planificación y control presupuestal'),
    (18, 'Cartera', 3, 'Gestión de cartera y cobros'),
    (19, 'Recobro', 3, 'Recobro de servicios de salud'),
    (20, 'Dirección Administrativa', 3, 'Dirección y coordinación administrativa'),
    (21, 'Estadística', 3, 'Análisis y gestión estadística'),
    (22, 'Sistemas', 3, 'Soporte y gestión tecnológica'),
    (23, 'Tesorería', 3, 'Gestión de tesorería y pagos'),
    (24, 'Alto Costo', 4, 'Gestión de alto costo'),
    (25, 'Baja Complejidad', 4, 'Atención de baja complejidad'),
    (26, 'Comunicación', 4, 'Gestión de comunicaciones institucionales'),
    (27, 'Dirección de Riesgos', 4, 'Gestión y control de riesgos'),
    (28, 'Mediana y Alta Complejidad', 4, 'Atención de mediana y alta complejidad'),
    (29, 'PYM', 4, 'Promoción y Mantenimiento de la Salud'),
    (30, 'Talento Humano', 4, 'Gestión del talento humano'),
    (31, 'Calidad', 5, 'Gestión de calidad institucional'),
    (32, 'Gerencia', 5, 'Dirección general de la institución'),
    (33, 'Contratación', 5, 'Gestión de contratos y proveedores'),
    (34, 'Control Interno', 5, 'Control interno y auditoría'),
    (35, 'Intercultural', 5, 'Gestión intercultural indígena')
ON CONFLICT (id) DO NOTHING;
SELECT setval('areas_id_seq', 35, true);

-- Cargos (10 cargos)
INSERT INTO cargos (id, nombre, descripcion, estado, area_id) VALUES
    (1, 'Gerente General', 'Dirección general de la institución', 'activo', 32),
    (2, 'Coordinador de Talento Humano', 'Coordinación del área de personal', 'activo', 30),
    (3, 'Médico', 'Prestación de servicios médicos', 'activo', 1),
    (4, 'Enfermero/a', 'Apoyo en servicios de salud', 'activo', NULL),
    (5, 'Contador', 'Gestión contable y financiera', 'activo', NULL),
    (6, 'Auxiliar Administrativo', 'Apoyo en labores administrativas', 'activo', NULL),
    (7, 'Técnico de Sistemas', 'Soporte y mantenimiento tecnológico', 'activo', 22),
    (8, 'Auditor', 'Auditoría y control interno', 'activo', 12),
    (9, 'Abogado', 'Asesoría jurídica', 'activo', NULL),
    (10, 'Psicólogo', 'Servicios de psicología', 'activo', NULL)
ON CONFLICT (id) DO NOTHING;
SELECT setval('cargos_id_seq', 10, true);

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
    (1, '10000001', 'Carlos', 'Rodríguez', 'c.rodriguez@dusakawi.com', 1, 32, NULL, 'RFID-001', '2020-01-15', true),
    (2, '10000002', 'María', 'López', 'm.lopez@dusakawi.com', 2, 30, 1, 'RFID-002', '2019-03-10', true),
    (3, '1015995066', 'Juliana', 'Torres', 'torresaaronjuliana@gmail.com', 7, 22, NULL, NULL, NULL, true)
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
