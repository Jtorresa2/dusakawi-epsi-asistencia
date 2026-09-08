const db = require("../config/db");
const bcrypt = require("bcryptjs");

function generarUsername(nombre, apellido) {
  const normalizar = (s) =>
    s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '.');
  return `${normalizar(nombre)}.${normalizar(apellido)}`;
}

// Replaces empleadoService.obtenerTodos
// Queries usuarios JOIN areas, cargos, roles
// JOIN LATERAL for asistencia stats (inasistencias, llegadas_tardias)
// Support filters: area, cargo
// NOTE: password_hash, huella and tarjeta_rfid are intentionally NOT selected
// (credential/biometric data must never leave the API).
exports.obtenerTodos = async (filtros = {}) => {
  let sql = `
    SELECT u.id, u.cedula, u.nombre, u.apellido, u.correo, u.telefono,
           u.fecha_nacimiento, u.cargo_id, u.area_id, u.horario_id,
           u.piso, u.fecha_ingreso, u.activo, u.rol_id, u.username,
           u.password_reset_required, u.creado_en,
           a.nombre AS area, COALESCE(u.piso, a.piso) AS piso, c.nombre AS cargo,
           r.nombre AS rol,
           COALESCE(stats.inasistencias, 0) AS inasistencias,
           COALESCE(stats.llegadas_tardias, 0) AS llegadas_tardias
    FROM usuarios u
    LEFT JOIN areas a ON u.area_id = a.id
    LEFT JOIN cargos c ON u.cargo_id = c.id
    LEFT JOIN roles r ON u.rol_id = r.id
    LEFT JOIN LATERAL (
      SELECT
        COUNT(*) FILTER (WHERE asis.estado = 'ausente') AS inasistencias,
        COUNT(*) FILTER (WHERE asis.estado = 'tardanza') AS llegadas_tardias
      FROM asistencia asis
      WHERE asis.usuario_id = u.id
    ) stats ON true
    WHERE 1=1
  `;
  const params = [];

  if (filtros.area) {
    sql += " AND a.nombre = $1";
    params.push(filtros.area);
  }
  if (filtros.cargo) {
    sql += ` AND c.nombre = $${params.length + 1}`;
    params.push(filtros.cargo);
  }

  sql += " ORDER BY u.nombre ASC";
  const { rows } = await db.query(sql, params);
  return rows;
};

// Replaces empleadoService.obtenerPorId
// Same column allowlist as obtenerTodos (no password_hash / huella / tarjeta_rfid)
exports.obtenerPorId = async (id) => {
  const { rows } = await db.query(
    `SELECT u.id, u.cedula, u.nombre, u.apellido, u.correo, u.telefono,
            u.fecha_nacimiento, u.cargo_id, u.area_id, u.horario_id,
            u.piso, u.fecha_ingreso, u.activo, u.rol_id, u.username,
            u.password_reset_required, u.creado_en,
            a.nombre AS area, COALESCE(u.piso, a.piso) AS piso, c.nombre AS cargo,
            r.nombre AS rol,
            COALESCE(stats.inasistencias, 0) AS inasistencias,
            COALESCE(stats.llegadas_tardias, 0) AS llegadas_tardias
     FROM usuarios u
     LEFT JOIN areas a ON u.area_id = a.id
     LEFT JOIN cargos c ON u.cargo_id = c.id
     LEFT JOIN roles r ON u.rol_id = r.id
     LEFT JOIN LATERAL (
       SELECT
         COUNT(*) FILTER (WHERE asis.estado = 'ausente') AS inasistencias,
         COUNT(*) FILTER (WHERE asis.estado = 'tardanza') AS llegadas_tardias
       FROM asistencia asis
       WHERE asis.usuario_id = u.id
     ) stats ON true
     WHERE u.id = $1`,
    [id]
  );
  return rows[0];
};

// Creates a user with ALL personal + work fields
// Auto-generates username from nombre.apellido if not provided
// Auto-generates password from cedula if not provided
// Hashes password with bcrypt
exports.crear = async (data) => {
  const { cedula, nombre, apellido, correo, telefono, fecha_nacimiento,
          cargo_id, area_id, piso, activo, rol_id } = data;

  if (!nombre || !apellido) {
    throw new Error("nombre y apellido son requeridos");
  }

  if (!correo || !String(correo).trim()) {
    const err = new Error("El correo es obligatorio");
    err.code = "VALIDACION";
    throw err;
  }

  // Auto-generate username from nombre.apellido if not provided
  const usernameBase = data.username || generarUsername(nombre, apellido);
  let username = usernameBase;
  let counter = 1;
  while (true) {
    const { rows: dup } = await db.query("SELECT id FROM usuarios WHERE username = $1", [username]);
    if (!dup.length) break;
    username = usernameBase + counter;
    counter++;
  }

  // Auto-generate password from cedula if not provided
  const password = data.password || cedula;
  if (!password) {
    throw new Error("Se requiere cedula o password para generar la contraseña");
  }
  const hash = await bcrypt.hash(password, 10);

  const { rows: [nuevo] } = await db.query(
    `INSERT INTO usuarios (cedula, nombre, apellido, correo, telefono, fecha_nacimiento,
                           cargo_id, area_id, piso, activo, rol_id,
                           username, password_hash, password_reset_required)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true) RETURNING id`,
    [cedula || null, nombre, apellido, correo || null, telefono || null, fecha_nacimiento || null,
     cargo_id || null, area_id || null, piso ?? null, activo !== undefined ? activo : 1,
     rol_id || null, username, hash]
  );
  const userId = nuevo.id;

  return { id: userId, password, username };
};

// Updates user fields including personal + role
// NOTE: username is immutable here — it is only assigned on create
// (auto-generated or explicit). Changing it on update silently breaks the
// user's login; the UI now disables it when editing, and the backend enforces it.
exports.actualizar = async (id, data) => {
  if (data.correo !== undefined && (!data.correo || !String(data.correo).trim())) {
    const err = new Error("El correo es obligatorio");
    err.code = "VALIDACION";
    throw err;
  }

  const camposPermitidos = ["cedula", "nombre", "apellido", "correo", "telefono",
                            "fecha_nacimiento", "cargo_id", "area_id", "piso",
                            "activo", "rol_id"];
  const sets = [];
  const params = [];

  for (const campo of camposPermitidos) {
    if (data[campo] !== undefined) {
      sets.push(`${campo} = $${params.length + 1}`);
      // Normalize empty strings to NULL for typed columns (date/integer/role ids).
      // The UI sends "" for untouched optional fields; PostgreSQL rejects "" for
      // date/integer types (invalid input syntax). `?? null` alone is NOT enough
      // because it only handles null/undefined.
      const valor = data[campo];
      params.push(campo === "activo" ? valor : (valor === "" ? null : valor));
    }
  }

  // Handle password separately (hash it). Empty string means "don't change":
  // hashing "" would silently reset the password to an empty value.
  if (data.password !== undefined && data.password !== "") {
    const hash = await bcrypt.hash(data.password, 10);
    sets.push(`password_hash = $${params.length + 1}`);
    params.push(hash);
  }

  if (sets.length > 0) {
    params.push(id);
    await db.query(`UPDATE usuarios SET ${sets.join(", ")} WHERE id = $${params.length}`, params);
  }
};

// Deletes user (CASCADE handles child records)
exports.eliminar = async (id) => {
  await db.query("DELETE FROM usuarios WHERE id = $1", [id]);
};
