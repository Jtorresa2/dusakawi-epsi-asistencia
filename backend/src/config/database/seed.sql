-- =====================================================================
-- SEED DATA: User, attendance and incident management system
-- Target engine: PostgreSQL
-- Notes:
--   * Rows are referenced by natural/unique keys via subqueries (name,
--     username, document_number, etc.) instead of hardcoded UUIDs, so
--     the script stays idempotent and readable.
--   * ON CONFLICT ... DO NOTHING is used wherever a UNIQUE constraint
--     exists, so this script can be re-run safely against catalog and
--     master-data tables.
--   * requests, attendances and incidents represent discrete events
--     rather than catalog data, so they are inserted as plain INSERTs
--     (re-running the script would duplicate them by design).
--   * Run this after schema.sql has been executed.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- document_types
-- ---------------------------------------------------------------------
INSERT INTO document_types (name) VALUES
    ('Cédula de Ciudadanía'),
    ('Tarjeta de Identidad'),
    ('Cédula de Extranjería'),
    ('Pasaporte')
ON CONFLICT (name) DO NOTHING;

-- ---------------------------------------------------------------------
-- roles
-- ---------------------------------------------------------------------
INSERT INTO roles (name, description) VALUES
    ('Administrador', 'Acceso total al sistema'),
    ('Talento Humano', 'Gestión de personal y reportes'),
    ('Empleado', 'Auto-servicio y marcación')
ON CONFLICT (name) DO NOTHING;

-- ---------------------------------------------------------------------
-- actions (used by role permissions)
-- ---------------------------------------------------------------------
INSERT INTO actions (name, description) VALUES
    ('dashboard', 'Acceso al panel de control'),
    ('dispositivos', 'Acceso a la gestión de dispositivos'),
    ('empleados', 'Acceso a la gestión de empleados'),
    ('reportes', 'Acceso a los reportes'),
    ('usuarios', 'Acceso a la gestión de usuarios')
ON CONFLICT (name) DO NOTHING;

-- ---------------------------------------------------------------------
-- floors
-- ---------------------------------------------------------------------
INSERT INTO floors (name) VALUES
    ('Piso 1'),
    ('Piso 2'),
    ('Piso 3'),
    ('Piso 4'),
    ('Piso 5')
ON CONFLICT (name) DO NOTHING;

-- ---------------------------------------------------------------------
-- area
-- ---------------------------------------------------------------------
INSERT INTO areas (floor_id, name, description) VALUES
    ((SELECT id FROM floors WHERE name = 'Piso 1'), 'SIAU', 'Sistema de Información y Atención al Usuario'),
    ((SELECT id FROM floors WHERE name = 'Piso 1'), 'PQR', 'Peticiones, Quejas y Reclamos'),
    ((SELECT id FROM floors WHERE name = 'Piso 1'), 'Call Center', 'Centro de atención telefónica'),
    ((SELECT id FROM floors WHERE name = 'Piso 1'), 'Autorizaciones', 'Gestión de autorizaciones médicas'),
    ((SELECT id FROM floors WHERE name = 'Piso 1'), 'Aseguramiento', 'Gestión de aseguramiento en salud'),
    ((SELECT id FROM floors WHERE name = 'Piso 1'), 'Psicología', 'Servicios de psicología'),
    ((SELECT id FROM floors WHERE name = 'Piso 1'), 'Recepción', 'Recepción y atención al usuario'),
    ((SELECT id FROM floors WHERE name = 'Piso 1'), 'Transporte', 'Gestión de transporte de pacientes'),
    ((SELECT id FROM floors WHERE name = 'Piso 1'), 'MIPRES', 'Prescripción de medicamentos y servicios'),
    ((SELECT id FROM floors WHERE name = 'Piso 1'), 'Portabilidad', 'Gestión de portabilidad'),
    ((SELECT id FROM floors WHERE name = 'Piso 1'), 'Referencia', 'Referencia y contrarreferencia'),
    ((SELECT id FROM floors WHERE name = 'Piso 2'), 'Auditoría de Cuentas Médicas', 'Auditoría y control de cuentas médicas'),
    ((SELECT id FROM floors WHERE name = 'Piso 2'), 'Radicación', 'Radicación de documentos'),
    ((SELECT id FROM floors WHERE name = 'Piso 2'), 'Archivo', 'Gestión documental y archivo'),
    ((SELECT id FROM floors WHERE name = 'Piso 2'), 'SARLAFT', 'Sistema de Administración del Riesgo de Lavado de Activos'),
    ((SELECT id FROM floors WHERE name = 'Piso 3'), 'Contabilidad', 'Gestión contable'),
    ((SELECT id FROM floors WHERE name = 'Piso 3'), 'Presupuesto', 'Planificación y control presupuestal'),
    ((SELECT id FROM floors WHERE name = 'Piso 3'), 'Cartera', 'Gestión de cartera y cobros'),
    ((SELECT id FROM floors WHERE name = 'Piso 3'), 'Recobro', 'Recobro de servicios de salud'),
    ((SELECT id FROM floors WHERE name = 'Piso 3'), 'Dirección Administrativa', 'Dirección y coordinación administrativa'),
    ((SELECT id FROM floors WHERE name = 'Piso 3'), 'Estadística', 'Análisis y gestión estadística'),
    ((SELECT id FROM floors WHERE name = 'Piso 3'), 'Sistemas', 'Soporte y gestión tecnológica'),
    ((SELECT id FROM floors WHERE name = 'Piso 3'), 'Tesorería', 'Gestión de tesorería y pagos'),
    ((SELECT id FROM floors WHERE name = 'Piso 4'), 'Alto Costo', 'Gestión de alto costo'),
    ((SELECT id FROM floors WHERE name = 'Piso 4'), 'Baja Complejidad', 'Atención de baja complejidad'),
    ((SELECT id FROM floors WHERE name = 'Piso 4'), 'Comunicación', 'Gestión de comunicaciones institucionales'),
    ((SELECT id FROM floors WHERE name = 'Piso 4'), 'Dirección de Riesgos', 'Gestión y control de riesgos'),
    ((SELECT id FROM floors WHERE name = 'Piso 4'), 'Mediana y Alta Complejidad', 'Atención de mediana y alta complejidad'),
    ((SELECT id FROM floors WHERE name = 'Piso 4'), 'PYM', 'Promoción y Mantenimiento de la Salud'),
    ((SELECT id FROM floors WHERE name = 'Piso 4'), 'Talento Humano', 'Gestión del talento humano'),
    ((SELECT id FROM floors WHERE name = 'Piso 5'), 'Calidad', 'Gestión de calidad institucional'),
    ((SELECT id FROM floors WHERE name = 'Piso 5'), 'Gerencia', 'Dirección general de la institución'),
    ((SELECT id FROM floors WHERE name = 'Piso 5'), 'Contratación', 'Gestión de contratos y proveedores'),
    ((SELECT id FROM floors WHERE name = 'Piso 5'), 'Control Interno', 'Control interno y auditoría'),
    ((SELECT id FROM floors WHERE name = 'Piso 5'), 'Intercultural', 'Gestión intercultural indígena')
ON CONFLICT (name, floor_id) DO NOTHING;

-- ---------------------------------------------------------------------
-- positions (cargos)
-- ---------------------------------------------------------------------
INSERT INTO positions (name, description) VALUES
    ('Gerente General', 'Dirección general de la institución'),
    ('Coordinador de Talento Humano', 'Coordinación del área de personal'),
    ('Médico', 'Prestación de servicios médicos'),
    ('Enfermero/a', 'Apoyo en servicios de salud'),
    ('Contador', 'Gestión contable y financiera'),
    ('Auxiliar Administrativo', 'Apoyo en labores administrativas'),
    ('Técnico de Sistemas', 'Soporte y mantenimiento tecnológico'),
    ('Auditor', 'Auditoría y control interno'),
    ('Abogado', 'Asesoría jurídica'),
    ('Psicólogo', 'Servicios de psicología')
ON CONFLICT (name) DO NOTHING;

-- ---------------------------------------------------------------------
-- role_actions (permissions mapping)
-- ---------------------------------------------------------------------
INSERT INTO role_actions (role_id, action_id)
VALUES
    ((SELECT id FROM roles WHERE name = 'Administrador'), (SELECT id FROM actions WHERE name = 'dashboard')),
    ((SELECT id FROM roles WHERE name = 'Administrador'), (SELECT id FROM actions WHERE name = 'dispositivos')),
    ((SELECT id FROM roles WHERE name = 'Administrador'), (SELECT id FROM actions WHERE name = 'empleados')),
    ((SELECT id FROM roles WHERE name = 'Administrador'), (SELECT id FROM actions WHERE name = 'reportes')),
    ((SELECT id FROM roles WHERE name = 'Administrador'), (SELECT id FROM actions WHERE name = 'usuarios')),
    ((SELECT id FROM roles WHERE name = 'Talento Humano'), (SELECT id FROM actions WHERE name = 'dashboard')),
    ((SELECT id FROM roles WHERE name = 'Talento Humano'), (SELECT id FROM actions WHERE name = 'dispositivos')),
    ((SELECT id FROM roles WHERE name = 'Talento Humano'), (SELECT id FROM actions WHERE name = 'empleados')),
    ((SELECT id FROM roles WHERE name = 'Talento Humano'), (SELECT id FROM actions WHERE name = 'reportes')),
    ((SELECT id FROM roles WHERE name = 'Talento Humano'), (SELECT id FROM actions WHERE name = 'usuarios')),
    ((SELECT id FROM roles WHERE name = 'Empleado'), (SELECT id FROM actions WHERE name = 'dashboard')),
    ((SELECT id FROM roles WHERE name = 'Empleado'), (SELECT id FROM actions WHERE name = 'dispositivos')),
    ((SELECT id FROM roles WHERE name = 'Empleado'), (SELECT id FROM actions WHERE name = 'empleados')),
    ((SELECT id FROM roles WHERE name = 'Empleado'), (SELECT id FROM actions WHERE name = 'reportes')),
    ((SELECT id FROM roles WHERE name = 'Empleado'), (SELECT id FROM actions WHERE name = 'usuarios'))
ON CONFLICT (role_id, action_id) DO NOTHING;

-- ---------------------------------------------------------------------
-- holidays
-- no UNIQUE constraint exists on this table, so a NOT EXISTS guard is
-- used to keep the script idempotent.
-- ---------------------------------------------------------------------
INSERT INTO holidays (name, type, date, active)
SELECT v.name, v.type, v.date, v.active
FROM (VALUES
    ('Año Nuevo', 'nacional', DATE '2026-01-01', TRUE),
    ('Día del Trabajo', 'nacional', DATE '2026-05-01', TRUE),
    ('Independencia Nacional', 'nacional', DATE '2026-07-20', TRUE),
    ('Navidad', 'nacional', DATE '2026-12-25', TRUE)
) AS v(name, type, date, active)
WHERE NOT EXISTS (
    SELECT 1 FROM holidays h WHERE h.name = v.name AND h.date = v.date
);

-- ---------------------------------------------------------------------
-- users
-- password values below are placeholders representing already-hashed
-- values; replace with real bcrypt/argon2 hashes generated by the app.
-- ---------------------------------------------------------------------
INSERT INTO users (
    first_name, middle_name, first_surname, second_surname,
    date_of_birth, place_of_birth, address, phone, cell,
    position_id, area_id, username, password_hash, email
) VALUES
    (
        'Juliana', NULL, 'Torres', 'Aaron',
        '1995-04-12', 'Astrea', 'Calle 10 # 5-23', NULL, '3001234567',
        (SELECT id FROM positions WHERE name = 'Técnico de Sistemas'),
        (SELECT a.id FROM areas a JOIN floors f ON a.floor_id = f.id WHERE a.name = 'Sistemas' AND f.name = 'Piso 3'),
        'Jtorresa22', '$2a$12$w5cCwla/RnLBWFTrLn0snOODkQlsZ2Lw96igxODh4KrdWy3ScyS8K', 'jtorresa@email.com'
    ),
    (
        'María', NULL, 'Lopez', 'Peréz',
        '1990-09-25', 'Valledupar', 'Carrera 15 # 20-14', NULL, '3009876543',
        (SELECT id FROM positions WHERE name = 'Coordinador de Talento Humano'),
        (SELECT a.id FROM areas a JOIN floors f ON a.floor_id = f.id WHERE a.name = 'Talento Humano' AND f.name = 'Piso 4'),
        'talento', '$2b$10$FnNwnu0sg.DOrspnoCm91.PVx/HHmKhXM7fUGh6i1mZQLN7JhIVR.', 'm.lopez@dusakawi.com'
    ),
    (
        'Carlos', NULL, 'Rodríguez', 'Rojas',
        '1992-11-05', 'Barranquilla', 'Calle 72 # 8-90', '3155556677', '3184455667',
        (SELECT id FROM positions WHERE name = 'Contador'),
        (SELECT a.id FROM areas a JOIN floors f ON a.floor_id = f.id WHERE a.name = 'Contabilidad' AND f.name = 'Piso 3'),
        'carlos', '$2b$10$QfVbkqSfSztAqeMBBcIOxuyeCFGxeCa/X3ErYjTvG5YSKbzM5SHvG', 'c.rodriguez@dusakawi.com'
    )
ON CONFLICT (username) DO NOTHING;

-- ---------------------------------------------------------------------
-- document_details
-- ---------------------------------------------------------------------
INSERT INTO document_details (
    document_type_id, user_id, document_number, issue_date, place_of_issue
)
VALUES
    (
        (SELECT id FROM document_types WHERE name = 'Cédula de Ciudadanía'),
        (SELECT id FROM users WHERE username = 'Jtorresa22'),
        '1065432187', '2012-03-15', 'Valledupar'
    ),
    (
        (SELECT id FROM document_types WHERE name = 'Cédula de Ciudadanía'),
        (SELECT id FROM users WHERE username = 'talento'),
        '1073654298', '2015-07-22', 'Valledupar'
    ),
    (
        (SELECT id FROM document_types WHERE name = 'Cédula de Extranjería'),
        (SELECT id FROM users WHERE username = 'carlos'),
        '1007654321', '2018-05-30', 'Barranquilla'
    )
ON CONFLICT (document_number) DO NOTHING;

-- ---------------------------------------------------------------------
-- user_roles
-- ---------------------------------------------------------------------
INSERT INTO user_roles (user_id, role_id)
VALUES
    ((SELECT id FROM users WHERE username = 'carlos'), (SELECT id FROM roles WHERE name = 'Empleado')),
    ((SELECT id FROM users WHERE username = 'talento'), (SELECT id FROM roles WHERE name = 'Talento Humano')),
    ((SELECT id FROM users WHERE username = 'Jtorresa22'), (SELECT id FROM roles WHERE name = 'Administrador'))
ON CONFLICT (user_id, role_id) DO NOTHING;

-- ---------------------------------------------------------------------
-- requests
-- event data: inserted as-is, not guarded with ON CONFLICT.
-- ---------------------------------------------------------------------
INSERT INTO requests (user_id, start_date, end_date, type) VALUES
    ((SELECT id FROM users WHERE username = 'carlos'), '2026-08-10', '2026-08-12', 'vacaciones'),
    ((SELECT id FROM users WHERE username = 'talento'), '2026-08-20', '2026-08-20', 'permiso_médico'),
    (NULL, '2026-09-01', '2026-09-05', 'mantenimiento_general');

-- ---------------------------------------------------------------------
-- attendances
-- event data: inserted as-is, not guarded with ON CONFLICT.
-- ---------------------------------------------------------------------
INSERT INTO attendances (user_id, first_entry_time, last_entry_time, first_departure_time, last_departure_time) VALUES
    ((SELECT id FROM users WHERE username = 'carlos'), '08:00:00', '08:00:00', '17:00:00', '17:05:00'),
    ((SELECT id FROM users WHERE username = 'talento'), '08:15:00', '08:15:00', '17:10:00', '17:10:00'),
    ((SELECT id FROM users WHERE username = 'Jtorresa22'), '07:55:00', '07:55:00', '16:58:00', '16:58:00');
-- ---------------------------------------------------------------------
-- incidents
-- event data: inserted as-is, not guarded with ON CONFLICT.
-- ---------------------------------------------------------------------
INSERT INTO incidents (
    user_id, type, description, status, priority,
    evidence, observation, rejection_reason, signed_file, reviewed_by
) VALUES
    (
        (SELECT id FROM users WHERE username = 'talento'),
        'llegada_tarde', 'Llegada 20 minutos tarde por corte de vía', 'aprobado', 'baja',
        'evidencia_transito.jpg', 'Justificación validada con reporte de tránsito', NULL,
        'firma_luis.pdf', (SELECT id FROM users WHERE username = 'carlos')
    ),
    (
        (SELECT id FROM users WHERE username = 'Jtorresa22'),
        'ausencia', 'Ausencia sin previo aviso', 'rechazado', 'alta',
        NULL, 'No se presentó soporte médico', 'Falta de justificación válida',
        'firma_ana.pdf', (SELECT id FROM users WHERE username = 'talento')
    ),
    (
        (SELECT id FROM users WHERE username = 'carlos'),
        'equipo_dañado', 'Equipo de cómputo presenta fallas de encendido', 'pendiente', 'media',
        'foto_equipo.jpg', NULL, NULL,
        NULL, (SELECT id FROM users WHERE username = 'carlos')
    );

COMMIT;