-- =====================================================================
-- SEED DATA: User and attendance management system
-- Target engine: PostgreSQL
-- Notes:
--   * Rows are referenced by natural/unique keys via subqueries (name,
--     username, document_number, etc.) instead of hardcoded UUIDs, so
--     the script stays idempotent and readable.
--   * ON CONFLICT ... DO NOTHING is used wherever a UNIQUE constraint
--     exists, so this script can be re-run safely against catalog and
--     master-data tables.
--   * requests and attendances represent discrete events
--     rather than catalog data, so they are inserted as plain INSERTs
--     (re-running the script would duplicate them by design).
--   * Run this after schema.sql has been executed.
-- =====================================================================

BEGIN;

-- Tables live in the "asistencia" namespace. The SET search_path in
-- schema.sql is session-scoped, so it does not carry over into this script.
SET search_path TO asistencia, public;

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
    ('Talento Humano', 'Gestión de personal y reportes')
ON CONFLICT (name) DO NOTHING;

-- ---------------------------------------------------------------------
-- actions (permission matrix)
--
-- The canonical catalog is the frontend module map:
--   frontend/src/features/roles/config/modulosPermisos.js
--     ACCIONES         -> 5 verbs (ver, crear, editar, eliminar, exportar)
--     MODULOS_PERMISOS -> 14 module keys
--
-- The UI builds the key "<module>.<action>" and POSTs it to
-- PUT /usuarios/roles/:id, so these rows MUST mirror that file 1:1.
-- A permission absent here can never be granted to any role.
-- 14 modules x 5 actions = 70.
-- ---------------------------------------------------------------------
INSERT INTO actions (name, description)
SELECT m.clave || '.' || v.accion,
       m.titulo || ' — ' || initcap(v.accion)
FROM (VALUES
    ('dashboard',        'Dashboard'),
    ('personal',         'Personal'),
    ('asistencia',       'Asistencia'),
    ('seguimiento',      'Seguimiento de Asistencia'),
    ('horarios',         'Horarios'),
    ('novedades',        'Novedades Laborales'),
    ('cargos',           'Cargos'),
    ('areas',            'Áreas'),
    ('festivos',         'Festivos'),
    ('reportes',         'Reportes'),
    ('roles',            'Roles'),
    ('configuracion',    'Configuración'),
    ('copias_seguridad', 'Copias de Seguridad'),
    ('perfil',           'Mi Perfil')
) AS m(clave, titulo)
CROSS JOIN (VALUES
    ('ver'), ('crear'), ('editar'), ('eliminar'), ('exportar')
) AS v(accion)
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
--
-- Administrador: every action (108).
-- Talento Humano: the 11 operational modules x 6 actions (66).
-- It is deliberately NOT granted roles, configuracion,
-- copias_seguridad, dispositivos, turnos, mi_asistencia or
-- mis_solicitudes: those are administration-only or personal to
-- each employee.
-- ---------------------------------------------------------------------
INSERT INTO role_actions (role_id, action_id)
SELECT r.id, a.id
FROM roles r
CROSS JOIN actions a
WHERE r.name = 'Administrador'
ON CONFLICT (role_id, action_id) DO NOTHING;

INSERT INTO role_actions (role_id, action_id)
SELECT r.id, a.id
FROM roles r
CROSS JOIN actions a
WHERE r.name = 'Talento Humano'
  AND split_part(a.name, '.', 1) IN (
      'areas', 'asistencia', 'cargos', 'dashboard', 'festivos',
      'horarios', 'novedades', 'perfil', 'personal', 'reportes',
      'seguimiento'
  )
ON CONFLICT (role_id, action_id) DO NOTHING;

-- ---------------------------------------------------------------------
-- holidays
-- One holiday per date: holidays carries UNIQUE (date), so the guard
-- checks the date alone. type is stored in Spanish ('nacional'); the
-- legacy English 'national' value was purged from production.
-- ---------------------------------------------------------------------
INSERT INTO holidays (name, type, date, active)
SELECT v.name, 'nacional', v.date, TRUE
FROM (VALUES
    ('Año Nuevo',                  DATE '2026-01-01'),
    ('Día de los Reyes Magos',     DATE '2026-01-12'),
    ('Día de San José',            DATE '2026-03-23'),
    ('Jueves Santo',               DATE '2026-04-02'),
    ('Viernes Santo',              DATE '2026-04-03'),
    ('Domingo de Resurrección',    DATE '2026-04-05'),
    ('Día del Trabajo',            DATE '2026-05-01'),
    ('Ascensión del Señor',        DATE '2026-05-18'),
    ('Corpus Christi',             DATE '2026-06-08'),
    ('Sagrado Corazón de Jesús',   DATE '2026-06-15'),
    ('San Pedro y San Pablo',      DATE '2026-06-29'),
    ('Virgen de Chiquinquirá',      DATE '2026-07-13'),
    ('Día de la Independencia',    DATE '2026-07-20'),
    ('Batalla de Boyacá',          DATE '2026-08-07'),
    ('Asunción de la Virgen',      DATE '2026-08-17'),
    ('Día de la Raza',             DATE '2026-10-12'),
    ('Todos los Santos',           DATE '2026-11-02'),
    ('Independencia de Cartagena', DATE '2026-11-16'),
    ('Inmaculada Concepción',      DATE '2026-12-08'),
    ('Navidad',                    DATE '2026-12-25')
) AS v(name, date)
WHERE NOT EXISTS (
    SELECT 1 FROM holidays h WHERE h.date = v.date
);

-- ---------------------------------------------------------------------
-- schedules
-- is_default marks Administrativo Estricto as the company default
-- (5 min entry tolerance). No user is bound to a schedule yet: the
-- seed does not fabricate assignments.
-- ---------------------------------------------------------------------
INSERT INTO schedules (name, modality, workday_type, tolerance_minutes,
                       tolerance_departure_minutes, expected_hours,
                       description, active, is_default)
VALUES
    ('Administrativo Estricto',  'strict',   'fixed',   5, 0, NULL,
     NULL, TRUE, TRUE),
    ('Administrativo Flexible', 'flexible', 'fixed',   0, 0, NULL,
     NULL, TRUE, FALSE),
    ('Call Center',             'flexible', 'by_hours', 0, 0, 6.50,
     'Jornada por horas trabajadas (6h, 6.5h, nocturno 11h)', TRUE, FALSE),
    ('Operativo de Aseo',       'strict',   'fixed',   0, 0, NULL,
     'Horario fijo 06:00-11:00 y 13:00-15:00', TRUE, FALSE)
ON CONFLICT (name) DO NOTHING;

-- ---------------------------------------------------------------------
-- schedule_details (daily breakdown)
-- Call Center has no rows: production defines it by_hours (jornada
-- rotativa), not by a fixed daily window, so there is nothing to seed.
-- ---------------------------------------------------------------------
INSERT INTO schedule_details (schedule_id, day_of_week,
                              morning_entry, morning_exit,
                              afternoon_entry, afternoon_exit)
SELECT s.id, v.dia, v.ent::time, v.sal_man::time, v.ent_tar::time, v.sal_tar::time
FROM (VALUES
    ('Administrativo Estricto',  'Lunes',     '07:00', '12:00', '14:00', '18:00'),
    ('Administrativo Estricto',  'Martes',    '07:00', '12:00', '14:00', '18:00'),
    ('Administrativo Estricto',  'Miércoles', '07:00', '12:00', '14:00', '17:00'),
    ('Administrativo Estricto',  'Jueves',    '07:00', '12:00', '14:00', '17:00'),
    ('Administrativo Estricto',  'Viernes',   '07:00', '12:00', '14:00', '17:00'),
    ('Administrativo Flexible', 'Lunes',     '07:00', '12:00', '14:00', '18:00'),
    ('Administrativo Flexible', 'Martes',    '07:00', '12:00', '14:00', '18:00'),
    ('Administrativo Flexible', 'Miércoles', '07:00', '12:00', '14:00', '17:00'),
    ('Administrativo Flexible', 'Jueves',    '07:00', '12:00', '14:00', '17:00'),
    ('Administrativo Flexible', 'Viernes',   '07:00', '12:00', '14:00', '17:00'),
    ('Operativo de Aseo',       'Lunes',     '06:00', '11:00', '13:00', '15:00'),
    ('Operativo de Aseo',       'Martes',    '06:00', '11:00', '13:00', '15:00'),
    ('Operativo de Aseo',       'Miércoles', '06:00', '11:00', '13:00', '15:00'),
    ('Operativo de Aseo',       'Jueves',    '06:00', '11:00', '13:00', '15:00'),
    ('Operativo de Aseo',       'Viernes',   '06:00', '11:00', '13:00', '15:00')
) AS v(horario, dia, ent, sal_man, ent_tar, sal_tar)
JOIN schedules s ON s.name = v.horario
ON CONFLICT (schedule_id, day_of_week) DO NOTHING;

-- ---------------------------------------------------------------------
-- users
-- password values below are placeholders representing already-hashed
-- values; replace with real bcrypt/argon2 hashes generated by the app.
-- ---------------------------------------------------------------------
INSERT INTO users (
    first_name, middle_name, first_surname, second_surname,
    date_of_birth, place_of_birth, address, phone,
    position_id, area_id, username, password_hash, email
) VALUES
    (
        'Administrador', NULL, '', '',
        '2004-03-22', '', '', '3022451642',
        (SELECT id FROM positions WHERE name = 'Técnico de Sistemas'),
        (SELECT a.id FROM areas a JOIN floors f ON a.floor_id = f.id WHERE a.name = 'Sistemas' AND f.name = 'Piso 3'),
        'Administrador', '$2b$10$zn/sS718ZiJPpRGQ4nQNJu/bhi/.OBwEVgV8SNmXLa85qoAtjLjU6', 'torresaaronjuliana@gmail.com'
    ),
    (
        'María', NULL, 'Lopez', 'Peréz',
        '1990-09-25', 'Valledupar', 'Carrera 15 # 20-14', '3009876543',
        (SELECT id FROM positions WHERE name = 'Coordinador de Talento Humano'),
        (SELECT a.id FROM areas a JOIN floors f ON a.floor_id = f.id WHERE a.name = 'Talento Humano' AND f.name = 'Piso 4'),
        'talento', '$2b$10$FnNwnu0sg.DOrspnoCm91.PVx/HHmKhXM7fUGh6i1mZQLN7JhIVR.', 'm.lopez@dusakawi.com'
    )
-- El indice uq_users_username es PARCIAL (WHERE username IS NOT NULL), asi que
-- el conflict target debe repetir el mismo predicado: un ON CONFLICT (username)
-- sin predicado no encuentra indice y aborta el seed.
ON CONFLICT (username) WHERE username IS NOT NULL DO NOTHING;

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
        '111111111', '2012-03-15', 'Valledupar'
    ),
    (
        (SELECT id FROM document_types WHERE name = 'Cédula de Ciudadanía'),
        (SELECT id FROM users WHERE username = 'talento'),
        '1073654298', '2015-07-22', 'Valledupar'
    )
ON CONFLICT (document_number) DO NOTHING;

-- ---------------------------------------------------------------------
-- user_roles
-- ---------------------------------------------------------------------
INSERT INTO user_roles (user_id, role_id)
VALUES
    ((SELECT id FROM users WHERE username = 'talento'), (SELECT id FROM roles WHERE name = 'Talento Humano')),
    ((SELECT id FROM users WHERE username = 'Administrador'), (SELECT id FROM roles WHERE name = 'Administrador'))
ON CONFLICT (user_id, role_id) DO NOTHING;

-- ---------------------------------------------------------------------
-- requests
-- event data: inserted as-is, not guarded with ON CONFLICT.
-- ---------------------------------------------------------------------
INSERT INTO requests (user_id, start_date, end_date, type) VALUES
    ((SELECT id FROM users WHERE username = 'talento'), '2026-08-20', '2026-08-20', 'permiso_médico'),
    (NULL, '2026-09-01', '2026-09-05', 'mantenimiento_general');

-- ---------------------------------------------------------------------
-- attendances
-- NOT seeded on purpose.
--
-- Attendance is transactional data written by the biometric device
-- (huella / RFID), not reference data. Seeding it would inject fabricated
-- marks into a real attendance history, so this table is left empty here
-- and populated at runtime by the device ingestion flow.
-- ---------------------------------------------------------------------

COMMIT;