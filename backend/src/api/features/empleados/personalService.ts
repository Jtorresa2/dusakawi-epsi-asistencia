import db from '../config/db';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Usuario, PersonalFiltros, CrearPersonalData, CrearUsuarioResult } from '../types';

// Style: initial of first name + FIRST surname + last 3 digits of the cédula
// (e.g. "Juliana" + "Torres Aarón" + "1234567" -> "jtorres567").
export function generarUsername(
  nombre: string,
  apellido: string,
  cedula?: string | null
): string {
  const normalizar = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
  const primeraPalabra = (s: string) => (s || '').trim().split(/\s+/)[0] ?? '';
  const inicial = (normalizar(primeraPalabra(nombre)) || 'u').charAt(0);
  const apellidoNorm = normalizar(primeraPalabra(apellido) || 'usuario').slice(0, 12);
  const digitos = String(cedula ?? '').replace(/\D/g, '').slice(-3);
  const sufijo = digitos || String(Math.floor(Math.random() * 900) + 100);
  return `${inicial}${apellidoNorm}${sufijo}`;
}

// Replaces empleadoService.obtenerTodos
// Queries users JOIN areas, positions, roles, document_details
// JOIN LATERAL for attendance stats (absences, late_arrivals)
// Support filters: area, position
// NOTE: password_hash, fingerprint and rfc_card are intentionally NOT selected
// (credential/biometric data must never leave the API).
export async function obtenerTodos(filtros: PersonalFiltros = {}): Promise<Usuario[]> {
  let sql = `
    SELECT u.id, dd.document_number AS cedula, u.first_name AS nombre, u.first_surname AS apellido, u.email AS correo, u.phone AS telefono,
           u.date_of_birth AS fecha_nacimiento, u.position_id AS cargo_id, u.area_id, u.schedule_id AS horario_id,
           NULLIF(regexp_replace(f.name, '\\D', '', 'g'), '')::int AS piso, u.hire_date AS fecha_ingreso, u.active AS activo, u.username,
           u.password_reset_required, u.created_at,
           a.name AS area, c.name AS cargo, r.name AS rol, r.id AS rol_id,
           COALESCE(stats.absences, 0) AS absences,
           COALESCE(stats.late_arrivals, 0) AS late_arrivals
    FROM users u
    LEFT JOIN document_details dd ON dd.user_id = u.id
    LEFT JOIN areas a ON u.area_id = a.id
    LEFT JOIN floors f ON a.floor_id = f.id
    LEFT JOIN positions c ON u.position_id = c.id
    LEFT JOIN user_roles ur ON ur.user_id = u.id
    LEFT JOIN roles r ON r.id = ur.role_id
    LEFT JOIN LATERAL (
      SELECT
        COUNT(*) FILTER (WHERE asis.status = 'absent') AS absences,
        COUNT(*) FILTER (WHERE asis.status = 'late') AS late_arrivals
      FROM attendances asis
      WHERE asis.user_id = u.id
    ) stats ON true
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (filtros.area) {
    sql += ' AND a.name = $1';
    params.push(filtros.area);
  }
  if (filtros.cargo) {
    sql += ` AND c.name = $${params.length + 1}`;
    params.push(filtros.cargo);
  }

  sql += ' ORDER BY u.first_name ASC';
  const { rows } = await db.query(sql, params);
  return rows;
}

// Replaces empleadoService.obtenerPorId
// Same column allowlist as obtenerTodos (no password_hash / fingerprint / rfc_card)
export async function obtenerPorId(id: string): Promise<Usuario | undefined> {
  const { rows } = await db.query(
    `SELECT u.id, dd.document_number AS cedula, u.first_name AS nombre, u.first_surname AS apellido, u.email AS correo, u.phone AS telefono,
            u.date_of_birth AS fecha_nacimiento, u.position_id AS cargo_id, u.area_id, u.schedule_id AS horario_id,
            NULLIF(regexp_replace(f.name, '\\D', '', 'g'), '')::int AS piso, u.hire_date AS fecha_ingreso, u.active AS activo, u.username,
            u.password_reset_required, u.created_at,
            a.name AS area, c.name AS cargo, r.name AS rol, r.id AS rol_id,
            COALESCE(stats.absences, 0) AS absences,
            COALESCE(stats.late_arrivals, 0) AS late_arrivals
     FROM users u
     LEFT JOIN document_details dd ON dd.user_id = u.id
     LEFT JOIN areas a ON u.area_id = a.id
     LEFT JOIN floors f ON a.floor_id = f.id
     LEFT JOIN positions c ON u.position_id = c.id
     LEFT JOIN user_roles ur ON ur.user_id = u.id
     LEFT JOIN roles r ON r.id = ur.role_id
     LEFT JOIN LATERAL (
       SELECT
         COUNT(*) FILTER (WHERE asis.status = 'absent') AS absences,
         COUNT(*) FILTER (WHERE asis.status = 'late') AS late_arrivals
       FROM attendances asis
       WHERE asis.user_id = u.id
     ) stats ON true
     WHERE u.id = $1`,
    [id]
  );
  return rows[0];
}

// Authorization guard: tells whether a requested role id is the Administrador
// role. Roles are identified by name (the stable natural key); roles.id is a
// random UUID and must never be hardcoded.
export async function esRolAdministrador(rolId: string): Promise<boolean> {
  const { rows } = await db.query(
    "SELECT 1 FROM roles WHERE id = $1 AND name = 'Administrador'",
    [rolId]
  );
  return rows.length > 0;
}

// Creates a user with ALL personal + work fields
// Auto-generates username (initial + first_surname + last 3 digits of cédula) if not provided
// Auto-generates a secure random password if not provided (cédula is NOT used)
// Hashes password with bcrypt
// user_roles is filled with the single rol_id when provided
// document_details is filled with the cedula (document_number) when provided
// Client-supplied UUIDs (rol_id, cargo_id, area_id) reference other tables.
// Validating them BEFORE the first write is what prevents a bad id from
// becoming a 23503 (foreign_key_violation) *after* the user row is already
// committed: on create that left an orphan user without role, and on update
// the role had already been deleted, leaving the user with no role at all.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function validarReferencias(refs: {
  rol_id?: string | null;
  cargo_id?: string | null;
  area_id?: string | null;
}): Promise<void> {
  // "tabla" is a hardcoded internal literal, never user input.
  const chequeos: { valor: unknown; tabla: string; mensaje: string }[] = [
    { valor: refs.rol_id, tabla: 'roles', mensaje: 'El rol indicado no existe' },
    { valor: refs.cargo_id, tabla: 'positions', mensaje: 'El cargo indicado no existe' },
    { valor: refs.area_id, tabla: 'areas', mensaje: 'El área indicada no existe' },
  ];

  for (const { valor, tabla, mensaje } of chequeos) {
    if (valor === undefined || valor === null || valor === '') continue;
    const texto = String(valor);
    // A malformed id cannot exist either: reject it here instead of letting
    // PostgreSQL raise 22P02 ("invalid input syntax for type uuid").
    const existe = UUID_RE.test(texto)
      ? (await db.query(`SELECT 1 FROM ${tabla} WHERE id = $1`, [texto])).rows.length > 0
      : false;

    if (!existe) {
      const err: Error & { code?: string } = new Error(mensaje);
      err.code = 'VALIDACION';
      throw err;
    }
  }
}

export async function crear(
  data: CrearPersonalData
): Promise<CrearUsuarioResult & { password: string }> {
  const {
    cedula, nombre, apellido, correo, telefono, fecha_nacimiento,
    cargo_id, area_id, activo, rol_id,
  } = data;

  if (!nombre || !apellido) {
    const err: Error & { code?: string } = new Error('nombre y apellido son requeridos');
    err.code = 'VALIDACION';
    throw err;
  }

  if (!correo || !String(correo).trim()) {
    const err: Error & { code?: string } = new Error('El correo es obligatorio');
    err.code = 'VALIDACION';
    throw err;
  }

  if (!telefono || !String(telefono).trim()) {
    const err: Error & { code?: string } = new Error('El teléfono es obligatorio');
    err.code = 'VALIDACION';
    throw err;
  }

  await validarReferencias({ rol_id, cargo_id, area_id });

  const password = data.password ?? crypto.randomBytes(32).toString('hex');
  // bcrypt is CPU-bound: hash BEFORE taking a pool connection, so no client
  // is held hostage during it.
  const hash = await bcrypt.hash(password, 10);

  // Every write of this operation runs in ONE transaction: a failure halfway
  // (bad FK, unexpected error) must not leave a user without their role.
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // Auto-generate username when not provided
    const usernameExplicito = data.username ?? null;
    let username = usernameExplicito ?? generarUsername(nombre, apellido, cedula ?? undefined);
    let counter = 1;
    while (true) {
      const { rows: dup } = await client.query('SELECT id FROM users WHERE username = $1', [username]);
      if (!dup.length) break;
      username = `${username}${counter++}`;
    }

    const {
      rows: [nuevo],
    } = await client.query(
`INSERT INTO users (first_name, first_surname, date_of_birth, place_of_birth, address,
                        phone, position_id, area_id, active, username, password_hash,
                        password_reset_required, email)
     VALUES ($1, $2, $3, $4, $5, $6,
             COALESCE($7, (SELECT id FROM positions ORDER BY created_at ASC, id ASC LIMIT 1)),
             COALESCE($8, (SELECT id FROM areas ORDER BY created_at ASC, id ASC LIMIT 1)),
             $9, $10, $11, true, $12)
     RETURNING id`,
    [
      nombre, apellido, fecha_nacimiento ?? '1900-01-01', '', '', telefono ?? null,
      cargo_id ?? null, area_id ?? null,
      activo !== undefined ? activo : 1, username, hash, correo,
    ]
    );
    const userId: string = nuevo.id;

    if (rol_id) {
      await client.query('INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)', [userId, rol_id]);
    }

    if (cedula && String(cedula).trim()) {
      await client.query(
        `INSERT INTO document_details (document_type_id, user_id, document_number, issue_date, place_of_issue)
         SELECT dt.id, $1, $2, CURRENT_DATE, ''
         FROM document_types dt
         WHERE dt.name = 'Cédula de Ciudadanía'
         LIMIT 1`,
        [userId, cedula]
      );
    }

    await client.query('COMMIT');
    return { id: userId, password, username };
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch {}
    throw err;
  } finally {
    client.release();
  }
}

// Updates user fields including personal + role
// NOTE: username is immutable here — it is only assigned on create
export async function actualizar(
  id: string,
  data: Partial<CrearPersonalData> & { password?: string }
): Promise<void> {
  if (data.correo !== undefined && (!data.correo || !String(data.correo).trim())) {
    const err: Error & { code?: string } = new Error('El correo es obligatorio');
    err.code = 'VALIDACION';
    throw err;
  }

  if (data.telefono !== undefined && (!data.telefono || !String(data.telefono).trim())) {
    const err: Error & { code?: string } = new Error('El teléfono es obligatorio');
    err.code = 'VALIDACION';
    throw err;
  }

  await validarReferencias({ rol_id: data.rol_id, cargo_id: data.cargo_id, area_id: data.area_id });

  const camposPermitidos: Record<string, keyof typeof data> = {
    first_name: 'nombre',
    first_surname: 'apellido',
    email: 'correo',
    phone: 'telefono',
    date_of_birth: 'fecha_nacimiento',
    position_id: 'cargo_id',
    area_id: 'area_id',
    active: 'activo',
  };
  const sets: string[] = [];
  const params: unknown[] = [];

  for (const [column, campo] of Object.entries(camposPermitidos)) {
    if (data[campo] !== undefined) {
      sets.push(`${column} = $${params.length + 1}`);
      const valor = data[campo];
      params.push(column === 'active' ? valor : (valor === '' ? null : valor));
    }
  }

  // Handle password separately (hash it). Empty string means "don't change"
  if (data.password !== undefined && data.password !== '') {
    const hash = await bcrypt.hash(data.password, 10);
    sets.push(`password_hash = $${params.length + 1}`);
    params.push(hash);
  }

  // Same reasoning as crear: every write of this update runs in ONE
  // transaction, so a failure after the role DELETE can never leave the user
  // without a role.
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    if (sets.length > 0) {
      params.push(id);
      await client.query(`UPDATE users SET ${sets.join(', ')} WHERE id = $${params.length}`, params);
    }

    // Role lives in the user_roles bridge: replace the single active role.
    if (data.rol_id !== undefined) {
      await client.query('DELETE FROM user_roles WHERE user_id = $1', [id]);
      await client.query('INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)', [id, data.rol_id]);
    }

    // Cédula lives in document_details (one document per user).
    if (data.cedula !== undefined && data.cedula !== '' && String(data.cedula).trim()) {
      await client.query(
        `INSERT INTO document_details (document_type_id, user_id, document_number, issue_date, place_of_issue)
         SELECT dt.id, $1, $2, CURRENT_DATE, ''
         FROM document_types dt
         WHERE dt.name = 'Cédula de Ciudadanía'
           AND NOT EXISTS (SELECT 1 FROM document_details dd WHERE dd.user_id = $1)
         LIMIT 1`,
        [id, data.cedula]
      );
      await client.query(
        'UPDATE document_details SET document_number = $2 WHERE user_id = $1',
        [id, data.cedula]
      );
    }

    await client.query('COMMIT');
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch {}
    throw err;
  } finally {
    client.release();
  }
}

// Deletes user physically, clearing child tables that do NOT use ON DELETE CASCADE.
// Runs inside a transaction so a failure rolls back everything.
export async function eliminar(id: string): Promise<void> {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [id]);
    await client.query('DELETE FROM user_roles WHERE user_id = $1', [id]);
    await client.query('DELETE FROM document_details WHERE user_id = $1', [id]);
    await client.query('DELETE FROM schedule_assignments WHERE user_id = $1', [id]);
    await client.query('DELETE FROM requests WHERE user_id = $1', [id]);
    await client.query('DELETE FROM attendances WHERE user_id = $1', [id]);
    await client.query('DELETE FROM incidents WHERE user_id = $1', [id]);
    await client.query('DELETE FROM news WHERE user_id = $1', [id]);
    const { rowCount } = await client.query('DELETE FROM users WHERE id = $1', [id]);
    if (!rowCount) {
      await client.query('ROLLBACK');
      const err: Error & { code?: string } = new Error('Usuario no encontrado');
      err.code = 'NOT_FOUND';
      throw err;
    }
    await client.query('COMMIT');
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch {}
    throw err;
  } finally {
    client.release();
  }
}
