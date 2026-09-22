-- =====================================================================
-- SEED DATA: Dusakawi EPSI — Attendance Control System
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

-- Route all inserts into the "asistencia" schema (created by schema.sql).
SET search_path TO asistencia, public;

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
-- actions: fine-grained "module.action" permission catalogue.
-- The names MUST match the UI matrix in
-- frontend/src/features/roles/config/modulosPermisos.js
-- ---------------------------------------------------------------------
INSERT INTO actions (name, description)
SELECT m.clave || '.' || a.accion, m.nombre || ' — ' || a.label
FROM (VALUES
    ('dashboard', 'Dashboard'),
    ('personal', 'Personal'),
    ('asistencia', 'Asistencia'),
    ('seguimiento', 'Seguimiento de Asistencia'),
    ('horarios', 'Horarios'),
    ('incidencias', 'Incidencias'),
    ('novedades', 'Novedades Laborales'),
    ('cargos', 'Cargos'),
    ('areas', 'Áreas'),
    ('turnos', 'Turnos'),
    ('festivos', 'Festivos'),
    ('tipos_incidencia', 'Tipos de Incidencia'),
    ('dispositivos', 'Dispositivos Biométricos'),
    ('reportes', 'Reportes'),
    ('roles', 'Roles'),
    ('configuracion', 'Configuración'),
    ('copias_seguridad', 'Copias de Seguridad'),
    ('perfil', 'Mi Perfil'),
    ('mi_asistencia', 'Mi Asistencia'),
    ('reportar_incidencia', 'Reportar Incidencia'),
    ('mis_solicitudes', 'Mis Solicitudes')
) AS m(clave, nombre)
CROSS JOIN (VALUES
    ('ver', 'Ver'), ('crear', 'Crear'), ('editar', 'Editar'),
    ('eliminar', 'Eliminar'), ('aprobar', 'Aprobar'), ('exportar', 'Exportar')
) AS a(accion, label)
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
-- areas
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
-- positions (job titles)
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
-- role_actions (fine-grained permissions per role)
-- ---------------------------------------------------------------------
-- Administrador: every permission
INSERT INTO role_actions (role_id, action_id)
SELECT r.id, acc.id
FROM roles r CROSS JOIN actions acc
WHERE r.name = 'Administrador'
ON CONFLICT (role_id, action_id) DO NOTHING;

-- Talento Humano: every action of its modules
INSERT INTO role_actions (role_id, action_id)
SELECT r.id, acc.id
FROM roles r
JOIN actions acc ON split_part(acc.name, '.', 1) IN
    ('dashboard', 'personal', 'asistencia', 'seguimiento', 'horarios',
     'incidencias', 'novedades', 'cargos', 'areas', 'festivos',
     'tipos_incidencia', 'reportes', 'perfil')
WHERE r.name = 'Talento Humano'
ON CONFLICT (role_id, action_id) DO NOTHING;

-- Empleado: dashboard + self-service
INSERT INTO role_actions (role_id, action_id)
SELECT r.id, acc.id
FROM roles r
JOIN actions acc ON split_part(acc.name, '.', 1) IN
    ('dashboard', 'perfil', 'mi_asistencia', 'reportar_incidencia', 'mis_solicitudes')
WHERE r.name = 'Empleado'
ON CONFLICT (role_id, action_id) DO NOTHING;

-- ---------------------------------------------------------------------
-- holidays
-- no UNIQUE constraint exists on this table, so a NOT EXISTS guard is
-- used to keep the script idempotent.
-- ---------------------------------------------------------------------
INSERT INTO holidays (name, type, date, active)
SELECT v.name, v.type, v.date, v.active
FROM (VALUES
    ('Año Nuevo', 'national', DATE '2026-01-01', TRUE),
    ('Día del Trabajo', 'national', DATE '2026-05-01', TRUE),
    ('Independencia Nacional', 'national', DATE '2026-07-20', TRUE),
    ('Navidad', 'national', DATE '2026-12-25', TRUE)
) AS v(name, type, date, active)
WHERE NOT EXISTS (
    SELECT 1 FROM holidays h WHERE h.name = v.name AND h.date = v.date
);

-- ---------------------------------------------------------------------
-- schedules (work schedules)
-- ---------------------------------------------------------------------
INSERT INTO schedules (
    name, tolerance_minutes, tolerance_departure_minutes, modality,
    workday_type, expected_hours, description, active, is_default
) VALUES
    ('Administrativo Estricto', 5, 0, 'strict', 'fixed', NULL, NULL, TRUE, FALSE),
    ('Administrativo Flexible', 0, 0, 'flexible', 'fixed', NULL, NULL, TRUE, FALSE),
    ('Call Center', 0, 0, 'flexible', 'by_hours', 6.50, 'Jornada por horas trabajadas (6h, 6.5h, nocturno 11h)', TRUE, FALSE),
    ('Operativo de Aseo', 0, 0, 'strict', 'fixed', NULL, 'Horario fijo 06:00-11:00 y 13:00-15:00', TRUE, FALSE)
ON CONFLICT (name) DO NOTHING;

-- ---------------------------------------------------------------------
-- schedule_details
-- Note: Call Center has no detail (rotating schedule by hours).
-- ---------------------------------------------------------------------
INSERT INTO schedule_details (schedule_id, day_of_week, morning_entry, morning_exit, afternoon_entry, afternoon_exit)
SELECT s.id, d.day_of_week, d.morning_entry::time, d.morning_exit::time, d.afternoon_entry::time, d.afternoon_exit::time
FROM schedules s
JOIN (VALUES
    ('Administrativo Estricto', 'Lunes',     '07:00', '12:00', '14:00', '18:00'),
    ('Administrativo Estricto', 'Martes',    '07:00', '12:00', '14:00', '18:00'),
    ('Administrativo Estricto', 'Miércoles', '07:00', '12:00', '14:00', '17:00'),
    ('Administrativo Estricto', 'Jueves',    '07:00', '12:00', '14:00', '17:00'),
    ('Administrativo Estricto', 'Viernes',   '07:00', '12:00', '14:00', '17:00'),
    ('Administrativo Flexible', 'Lunes',     '07:00', '12:00', '14:00', '18:00'),
    ('Administrativo Flexible', 'Martes',    '07:00', '12:00', '14:00', '18:00'),
    ('Administrativo Flexible', 'Miércoles', '07:00', '12:00', '14:00', '17:00'),
    ('Administrativo Flexible', 'Jueves',    '07:00', '12:00', '14:00', '17:00'),
    ('Administrativo Flexible', 'Viernes',   '07:00', '12:00', '14:00', '17:00'),
    ('Operativo de Aseo', 'Lunes',    '06:00', '11:00', '13:00', '15:00'),
    ('Operativo de Aseo', 'Martes',   '06:00', '11:00', '13:00', '15:00'),
    ('Operativo de Aseo', 'Miércoles','06:00', '11:00', '13:00', '15:00'),
    ('Operativo de Aseo', 'Jueves',   '06:00', '11:00', '13:00', '15:00'),
    ('Operativo de Aseo', 'Viernes',  '06:00', '11:00', '13:00', '15:00')
) AS d(schedule_name, day_of_week, morning_entry, morning_exit, afternoon_entry, afternoon_exit)
    ON s.name = d.schedule_name
WHERE NOT EXISTS (
    SELECT 1 FROM schedule_details sd
    WHERE sd.schedule_id = s.id AND sd.day_of_week = d.day_of_week
);

-- ---------------------------------------------------------------------
-- users
-- Passwords are bcrypt hashes. Seed credentials (test only):
--   Administrador / 123456       (Administrador)
--   talento    / talento123   (Talento Humano)
--   carlos     / 12345678     (Empleado)
-- ---------------------------------------------------------------------
INSERT INTO users (
    first_name, middle_name, first_surname, second_surname,
    date_of_birth, place_of_birth, address, phone,
    position_id, area_id, username, password_hash, email,
    active, password_reset_required, rfc_card, fingerprint, photo, hire_date
) VALUES
    (
        'Juliana', NULL, 'Torres', 'Aaron',
        '1995-04-12', 'Astrea', 'Calle 10 # 5-23', NULL,
        (SELECT id FROM positions WHERE name = 'Técnico de Sistemas'),
        (SELECT a.id FROM areas a JOIN floors f ON a.floor_id = f.id WHERE a.name = 'Sistemas' AND f.name = 'Piso 3'),
        'Administrador', '$2a$12$w5cCwla/RnLBWFTrLn0snOODkQlsZ2Lw96igxODh4KrdWy3ScyS8K', 'jtorresa@email.com',
        TRUE, FALSE, NULL, 'FP001', NULL, '2021-06-01'
    ),
    (
        'María', NULL, 'Lopez', 'Peréz',
        '1990-09-25', 'Valledupar', 'Carrera 15 # 20-14', NULL,
        (SELECT id FROM positions WHERE name = 'Coordinador de Talento Humano'),
        (SELECT a.id FROM areas a JOIN floors f ON a.floor_id = f.id WHERE a.name = 'Talento Humano' AND f.name = 'Piso 4'),
        'talento', '$2b$10$FnNwnu0sg.DOrspnoCm91.PVx/HHmKhXM7fUGh6i1mZQLN7JhIVR.', 'm.lopez@dusakawi.com',
        TRUE, FALSE, 'RFID-002', 'FP002', NULL, '2019-03-10'
    ),
    (
        'Carlos', NULL, 'Rodríguez', 'Rojas',
        '1992-11-05', 'Barranquilla', 'Calle 72 # 8-90', '3155556677',
        (SELECT id FROM positions WHERE name = 'Contador'),
        (SELECT a.id FROM areas a JOIN floors f ON a.floor_id = f.id WHERE a.name = 'Contabilidad' AND f.name = 'Piso 3'),
        'carlos', '$2b$10$tE2yMNyNQ/9GzOD51ZaI/.FBmQUzEr6AqNQh/cRDlR1/eHHK.FXVS', 'c.rodriguez@dusakawi.com',
        TRUE, FALSE, 'RFID-001', 'FP003', NULL, '2020-01-15'
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
        (SELECT id FROM users WHERE username = 'Administrador'),
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
        'CE897654', '2018-05-30', 'Barranquilla'
    )
ON CONFLICT (document_number) DO NOTHING;

-- ---------------------------------------------------------------------
-- user_roles
-- ---------------------------------------------------------------------
INSERT INTO user_roles (user_id, role_id)
VALUES
    ((SELECT id FROM users WHERE username = 'carlos'), (SELECT id FROM roles WHERE name = 'Empleado')),
    ((SELECT id FROM users WHERE username = 'talento'), (SELECT id FROM roles WHERE name = 'Talento Humano')),
    ((SELECT id FROM users WHERE username = 'Administrador'), (SELECT id FROM roles WHERE name = 'Administrador'))
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
-- Each row is the daily record for (user, date): the four timestamps,
-- worked hours, lateness and the derived day status.
-- ---------------------------------------------------------------------
INSERT INTO attendances (
    user_id, date, entry_timestamp, morning_departure_timestamp,
    afternoon_entry_timestamp, departure_timestamp,
    worked_hours, extra_hours, late_minutes, mark_type, status, observation, device_id
) VALUES
    (
        (SELECT id FROM users WHERE username = 'carlos'),
        DATE '2026-09-09',
        TIMESTAMPTZ '2026-09-09 07:00:00-05', TIMESTAMPTZ '2026-09-09 12:00:00-05',
        TIMESTAMPTZ '2026-09-09 13:00:00-05', TIMESTAMPTZ '2026-09-09 16:00:00-05',
        8.00, 0.00, 0, 'huella', 'on_time', NULL, 'RFID-001'
    ),
    (
        (SELECT id FROM users WHERE username = 'talento'),
        DATE '2026-09-09',
        TIMESTAMPTZ '2026-09-09 07:15:00-05', TIMESTAMPTZ '2026-09-09 12:00:00-05',
        TIMESTAMPTZ '2026-09-09 13:00:00-05', TIMESTAMPTZ '2026-09-09 17:00:00-05',
        8.75, 0.00, 15, 'huella', 'late', 'Llegada 15 minutos después de la tolerancia', 'RFID-002'
    ),
    (
        (SELECT id FROM users WHERE username = 'Administrador'),
        DATE '2026-09-10',
        TIMESTAMPTZ '2026-09-10 07:00:00-05', TIMESTAMPTZ '2026-09-10 12:00:00-05',
        TIMESTAMPTZ '2026-09-10 13:00:00-05', TIMESTAMPTZ '2026-09-10 16:00:00-05',
        8.00, 0.00, 0, 'huella', 'on_time', NULL, 'FP001'
    );

-- ---------------------------------------------------------------------
-- incidents
-- event data: inserted as-is, not guarded with ON CONFLICT.
-- ---------------------------------------------------------------------
INSERT INTO incidents (
    user_id, type, description, date, status, priority,
    evidence, observation, rejection_reason, signed_file, reviewed_by
) VALUES
    (
        (SELECT id FROM users WHERE username = 'talento'),
        'late', 'Llegada 20 minutos tarde por corte de vía', DATE '2026-09-09', 'approved', 'low',
        'evidencia_transito.jpg', 'Justificación validada con reporte de tránsito', NULL,
        'firma_luis.pdf', (SELECT id FROM users WHERE username = 'carlos')
    ),
    (
        (SELECT id FROM users WHERE username = 'Administrador'),
        'other', 'Ausencia sin previo aviso', DATE '2026-09-10', 'rejected', 'high',
        NULL, 'No se presentó soporte médico', 'Falta de justificación válida',
        'firma_ana.pdf', (SELECT id FROM users WHERE username = 'talento')
    ),
    (
        (SELECT id FROM users WHERE username = 'carlos'),
        'other', 'Equipo de cómputo presenta fallas de encendido', DATE '2026-09-10', 'pending', 'medium',
        'foto_equipo.jpg', NULL, NULL,
        NULL, (SELECT id FROM users WHERE username = 'carlos')
    );

-- ---------------------------------------------------------------------
-- config
-- ---------------------------------------------------------------------
INSERT INTO config (key, value, type) VALUES
    ('motor_bd', 'PostgreSQL', 'text')
ON CONFLICT (key) DO NOTHING;

COMMIT;