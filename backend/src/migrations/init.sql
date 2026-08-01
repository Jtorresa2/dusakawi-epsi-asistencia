-- =============================================
-- PostgreSQL Schema + Seed — Dusakawi Asistencia
-- =============================================

BEGIN;

-- =============================================
-- SCHEMA
-- =============================================

-- 1. roles
CREATE TABLE IF NOT EXISTS roles (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre      VARCHAR(100) NOT NULL UNIQUE,
    descripcion VARCHAR(255),
    creado_en   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1a. permisos_catalogo
CREATE TABLE IF NOT EXISTS permisos_catalogo (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre      VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    creado_en   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1b. rol_permiso (normalización 1NF)
CREATE TABLE IF NOT EXISTS rol_permiso (
    rol_id     UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permiso_id UUID NOT NULL REFERENCES permisos_catalogo(id) ON DELETE CASCADE,
    PRIMARY KEY (rol_id, permiso_id)
);

-- 2. areas
CREATE TABLE IF NOT EXISTS areas (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre      VARCHAR(100) NOT NULL UNIQUE,
    piso        INTEGER DEFAULT 1,
    descripcion TEXT DEFAULT '',
    creado_en   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. cargos
CREATE TABLE IF NOT EXISTS cargos (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre      VARCHAR(100) NOT NULL,
    descripcion TEXT,
    estado      VARCHAR(20) DEFAULT 'activo',
    creado_en   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    area_id     UUID REFERENCES areas(id)
);

-- 4. horarios
CREATE TABLE IF NOT EXISTS horarios (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre            VARCHAR(100) NOT NULL,
    tolerancia_minutos INTEGER DEFAULT 0,
    creado_en         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. horario_detalle
CREATE TABLE IF NOT EXISTS horario_detalle (
    id                  UUID DEFAULT gen_random_uuid(),
    horario_id          UUID NOT NULL REFERENCES horarios(id) ON DELETE CASCADE,
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
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cedula            VARCHAR(20) NOT NULL UNIQUE,
    nombre            VARCHAR(100) NOT NULL,
    apellido          VARCHAR(100) NOT NULL,
    correo            VARCHAR(255) UNIQUE,
    telefono          VARCHAR(50),
    fecha_nacimiento  DATE,
    cargo_id          UUID REFERENCES cargos(id),
    area_id           UUID REFERENCES areas(id),
    horario_id        UUID REFERENCES horarios(id),
    huella            TEXT,
    foto              TEXT,
    tarjeta_rfid      VARCHAR(50),
    fecha_ingreso     DATE,
    activo            BOOLEAN DEFAULT TRUE,
    creado_en         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empleado_id            UUID NOT NULL REFERENCES empleado(id),
    rol_id                 UUID NOT NULL REFERENCES roles(id),
    username               VARCHAR(255) NOT NULL UNIQUE,
    password_hash          VARCHAR(255) NOT NULL,
    activo                 BOOLEAN DEFAULT TRUE,
    password_reset_required BOOLEAN DEFAULT TRUE,
    ultimo_acceso          TIMESTAMP,
    creado_en              TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. asistencia
CREATE TABLE IF NOT EXISTS asistencia (
    id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empleado_id               UUID NOT NULL REFERENCES empleado(id),
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
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empleado_id     UUID NOT NULL REFERENCES empleado(id),
    tipo            VARCHAR(100) NOT NULL,
    descripcion     TEXT,
    evidencia_url   VARCHAR(500),
    archivo_firmado VARCHAR(500),
    fecha           DATE NOT NULL,
    estado          VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    prioridad       VARCHAR(20),
    motivo_rechazo  TEXT,
    observacion     TEXT,
    revisado_por    UUID REFERENCES usuarios(id),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. configuracion
CREATE TABLE IF NOT EXISTS configuracion (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clave           VARCHAR(100) NOT NULL UNIQUE,
    valor           TEXT NOT NULL,
    tipo            VARCHAR(20) NOT NULL,
    creado_en       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. permisos
CREATE TABLE IF NOT EXISTS permisos (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empleado_id     UUID NOT NULL REFERENCES empleado(id),
    fecha_desde     DATE NOT NULL,
    fecha_hasta     DATE NOT NULL,
    motivo          TEXT NOT NULL,
    tipo            VARCHAR(20) NOT NULL DEFAULT 'completo'
                    CHECK (tipo IN ('completo', 'mañana', 'tarde', 'horas', 'comision')),
    hora_desde      TIME,
    hora_hasta      TIME,
    registrado_por  UUID REFERENCES usuarios(id),
    estado          VARCHAR(20) NOT NULL DEFAULT 'aprobado'
                    CHECK (estado IN ('pendiente', 'aprobado', 'rechazado')),
    archivo_solicitud VARCHAR(500),
    archivo_firmado   VARCHAR(500),
    solicitado_por  UUID REFERENCES empleado(id),
    motivo_rechazo  TEXT,
    creado_en       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. festivos
CREATE TABLE IF NOT EXISTS festivos (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha      DATE NOT NULL UNIQUE,
    nombre     VARCHAR(200) NOT NULL,
    tipo       VARCHAR(50) NOT NULL DEFAULT 'nacional'
               CHECK (tipo IN ('nacional', 'regional', 'institucional')),
    activo     BOOLEAN DEFAULT TRUE,
    creado_en  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. reportes_historial
CREATE TABLE IF NOT EXISTS reportes_historial (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_reporte     VARCHAR(100) NOT NULL,
    usuario_nombre   VARCHAR(255) NOT NULL,
    formato          VARCHAR(20),
    filtros          TEXT,
    total_registros  INTEGER DEFAULT 0,
    fecha_generacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- SEED DATA — 3
-- =============================================

-- Roles
INSERT INTO roles (nombre, descripcion) VALUES
    ('Administrador', 'Acceso total al sistema'),
    ('Talento Humano', 'Gestión de personal y reportes'),
    ('Empleado', 'Auto-servicio y marcación')
ON CONFLICT (nombre) DO NOTHING;

-- Permisos catálogo
INSERT INTO permisos_catalogo (nombre, descripcion) VALUES
    ('dashboard', 'Acceso al panel principal'),
    ('dispositivos', 'Acceso a dispositivos'),
    ('empleados', 'Acceso a gestión de empleados'),
    ('reportes', 'Acceso a generación de reportes'),
    ('usuarios', 'Acceso a gestión de usuarios')
ON CONFLICT (nombre) DO NOTHING;

-- Rol_Permiso (resuelto por nombre)
INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permisos_catalogo p
WHERE r.nombre IN ('Administrador', 'Talento Humano', 'Empleado')
  AND p.nombre IN ('dashboard', 'dispositivos', 'empleados', 'reportes', 'usuarios')
ON CONFLICT (rol_id, permiso_id) DO NOTHING;

-- Areas (35 áreas operativas)
INSERT INTO areas (nombre, piso, descripcion) VALUES
    ('SIAU', 1, 'Sistema de Información y Atención al Usuario'),
    ('PQR', 1, 'Peticiones, Quejas y Reclamos'),
    ('Call Center', 1, 'Centro de atención telefónica'),
    ('Autorizaciones', 1, 'Gestión de autorizaciones médicas'),
    ('Aseguramiento', 1, 'Gestión de aseguramiento en salud'),
    ('Psicología', 1, 'Servicios de psicología'),
    ('Recepción', 1, 'Recepción y atención al usuario'),
    ('Transporte', 1, 'Gestión de transporte de pacientes'),
    ('MIPRES', 1, 'Prescripción de medicamentos y servicios'),
    ('Portabilidad', 1, 'Gestión de portabilidad'),
    ('Referencia', 1, 'Referencia y contrarreferencia'),
    ('Auditoría de Cuentas Médicas', 2, 'Auditoría y control de cuentas médicas'),
    ('Radicación', 2, 'Radicación de documentos'),
    ('Archivo', 2, 'Gestión documental y archivo'),
    ('SARLAFT', 2, 'Sistema de Administración del Riesgo de Lavado de Activos'),
    ('Contabilidad', 3, 'Gestión contable'),
    ('Presupuesto', 3, 'Planificación y control presupuestal'),
    ('Cartera', 3, 'Gestión de cartera y cobros'),
    ('Recobro', 3, 'Recobro de servicios de salud'),
    ('Dirección Administrativa', 3, 'Dirección y coordinación administrativa'),
    ('Estadística', 3, 'Análisis y gestión estadística'),
    ('Sistemas', 3, 'Soporte y gestión tecnológica'),
    ('Tesorería', 3, 'Gestión de tesorería y pagos'),
    ('Alto Costo', 4, 'Gestión de alto costo'),
    ('Baja Complejidad', 4, 'Atención de baja complejidad'),
    ('Comunicación', 4, 'Gestión de comunicaciones institucionales'),
    ('Dirección de Riesgos', 4, 'Gestión y control de riesgos'),
    ('Mediana y Alta Complejidad', 4, 'Atención de mediana y alta complejidad'),
    ('PYM', 4, 'Promoción y Mantenimiento de la Salud'),
    ('Talento Humano', 4, 'Gestión del talento humano'),
    ('Calidad', 5, 'Gestión de calidad institucional'),
    ('Gerencia', 5, 'Dirección general de la institución'),
    ('Contratación', 5, 'Gestión de contratos y proveedores'),
    ('Control Interno', 5, 'Control interno y auditoría'),
    ('Intercultural', 5, 'Gestión intercultural indígena')
ON CONFLICT (nombre) DO NOTHING;

-- Cargos (10 cargos)
INSERT INTO cargos (nombre, descripcion, estado, area_id) VALUES
    ('Gerente General', 'Dirección general de la institución', 'activo', (SELECT id FROM areas WHERE nombre = 'Gerencia')),
    ('Coordinador de Talento Humano', 'Coordinación del área de personal', 'activo', (SELECT id FROM areas WHERE nombre = 'Talento Humano')),
    ('Médico', 'Prestación de servicios médicos', 'activo', (SELECT id FROM areas WHERE nombre = 'SIAU')),
    ('Enfermero/a', 'Apoyo en servicios de salud', 'activo', NULL),
    ('Contador', 'Gestión contable y financiera', 'activo', NULL),
    ('Auxiliar Administrativo', 'Apoyo en labores administrativas', 'activo', NULL),
    ('Técnico de Sistemas', 'Soporte y mantenimiento tecnológico', 'activo', (SELECT id FROM areas WHERE nombre = 'Sistemas')),
    ('Auditor', 'Auditoría y control interno', 'activo', (SELECT id FROM areas WHERE nombre = 'Auditoría de Cuentas Médicas')),
    ('Abogado', 'Asesoría jurídica', 'activo', NULL),
    ('Psicólogo', 'Servicios de psicología', 'activo', NULL)
ON CONFLICT (nombre) DO NOTHING;

-- Horario
INSERT INTO horarios (nombre, tolerancia_minutos) VALUES
    ('Administrativo', 5)
ON CONFLICT (nombre) DO NOTHING;

-- Horario detalle (Lunes a Viernes)
INSERT INTO horario_detalle (horario_id, dia_semana, hora_entrada_manana, hora_salida_manana, hora_entrada_tarde, hora_salida_tarde) VALUES
    ((SELECT id FROM horarios WHERE nombre = 'Administrativo'), 'Lunes',     '07:00', '12:00', '14:00', '18:00'),
    ((SELECT id FROM horarios WHERE nombre = 'Administrativo'), 'Martes',    '07:00', '12:00', '14:00', '18:00'),
    ((SELECT id FROM horarios WHERE nombre = 'Administrativo'), 'Miércoles', '07:00', '12:00', '14:00', '17:00'),
    ((SELECT id FROM horarios WHERE nombre = 'Administrativo'), 'Jueves',    '07:00', '12:00', '14:00', '17:00'),
    ((SELECT id FROM horarios WHERE nombre = 'Administrativo'), 'Viernes',   '07:00', '12:00', '14:00', '17:00')
ON CONFLICT (horario_id, dia_semana) DO NOTHING;

-- Empleados
INSERT INTO empleado (cedula, nombre, apellido, correo, cargo_id, area_id, horario_id, tarjeta_rfid, fecha_ingreso, activo) VALUES
    ('10000001', 'Carlos', 'Rodríguez', 'c.rodriguez@dusakawi.com', (SELECT id FROM cargos WHERE nombre = 'Gerente General'), (SELECT id FROM areas WHERE nombre = 'Gerencia'), NULL, 'RFID-001', '2020-01-15', true),
    ('10000002', 'María', 'López', 'm.lopez@dusakawi.com', (SELECT id FROM cargos WHERE nombre = 'Coordinador de Talento Humano'), (SELECT id FROM areas WHERE nombre = 'Talento Humano'), (SELECT id FROM horarios WHERE nombre = 'Administrativo'), 'RFID-002', '2019-03-10', true),
    ('1015995066', 'Juliana', 'Torres', 'torresaaronjuliana@gmail.com', (SELECT id FROM cargos WHERE nombre = 'Técnico de Sistemas'), (SELECT id FROM areas WHERE nombre = 'Sistemas'), NULL, NULL, NULL, true)
ON CONFLICT (cedula) DO NOTHING;

-- Usuarios (con los password_hash reales de la base original)
INSERT INTO usuarios (empleado_id, rol_id, username, password_hash, activo, password_reset_required) VALUES
    ((SELECT id FROM empleado WHERE cedula = '10000001'), (SELECT id FROM roles WHERE nombre = 'Empleado'), 'carlos', '$2b$10$QfVbkqSfSztAqeMBBcIOxuyeCFGxeCa/X3ErYjTvG5YSKbzM5SHvG', true, false),
    ((SELECT id FROM empleado WHERE cedula = '10000002'), (SELECT id FROM roles WHERE nombre = 'Talento Humano'), 'talento', '$2b$10$FnNwnu0sg.DOrspnoCm91.PVx/HHmKhXM7fUGh6i1mZQLN7JhIVR.', true, false),
    ((SELECT id FROM empleado WHERE cedula = '1015995066'), (SELECT id FROM roles WHERE nombre = 'Administrador'), 'Jtorresa22', '$2b$10$UwXojDQlljyPI78khkYz8u4gWCb07lp90pXqS8wf4oqGnYzpptfGu', true, false)
ON CONFLICT (username) DO NOTHING;

-- Configuración: motor de base de datos
INSERT INTO configuracion (clave, valor, tipo) VALUES
    ('motor_bd', 'PostgreSQL', 'text')
ON CONFLICT (clave) DO NOTHING;

COMMIT;
