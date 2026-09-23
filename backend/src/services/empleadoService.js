const db = require("../config/db");
const { excluirRolesPorNombre, excluirRolesPorUserId, joinRoles } = require("./rolesFiltro");

exports.obtenerTodos = async (filtros = {}) => {
  let sql = `
    SELECT
      u.id,
      COALESCE(dd.document_number, '') AS cedula,
      u.first_name AS nombre,
      u.first_surname AS apellido,
      TRIM(CONCAT(u.first_name, ' ', COALESCE(u.middle_name, ''), ' ', u.first_surname, ' ', COALESCE(u.second_surname, ''))) AS empleado,
      u.email AS correo,
      u.email,
      COALESCE(u.phone, '') AS telefono,
      u.phone,
      TO_CHAR(u.date_of_birth, 'YYYY-MM-DD') AS fecha_nacimiento,
      u.position_id AS cargo_id,
      COALESCE(pos.name, '') AS cargo,
      u.area_id,
      COALESCE(ar.name, '') AS area,
      COALESCE(fl.name, '') AS piso,
      COALESCE(u.photo, '') AS foto_url,
      u.active::int AS activo,
      CASE WHEN u.active THEN 'activo' ELSE 'inactivo' END AS estado
    FROM users u
    LEFT JOIN document_details dd ON dd.user_id = u.id
    LEFT JOIN positions pos ON u.position_id = pos.id
    LEFT JOIN areas ar ON u.area_id = ar.id
    LEFT JOIN floors fl ON ar.floor_id = fl.id
    WHERE 1=1${excluirRolesPorUserId('u.id')}
  `;
  const params = [];

  if (filtros.area) {
    sql += " AND (ar.name ILIKE ? OR ar.id::text = ?)";
    params.push(`%${filtros.area}%`, filtros.area);
  }
  if (filtros.cargo) {
    sql += " AND (pos.name ILIKE ? OR pos.id::text = ?)";
    params.push(`%${filtros.cargo}%`, filtros.cargo);
  }

  sql += " ORDER BY u.first_name ASC";
  const [rows] = await db.query(sql, params);
  return rows;
};

exports.obtenerPorId = async (id) => {
  const [rows] = await db.query(
    `SELECT
      u.id,
      COALESCE(dd.document_number, '') AS cedula,
      u.first_name AS nombre,
      u.first_surname AS apellido,
      TRIM(CONCAT(u.first_name, ' ', COALESCE(u.middle_name, ''), ' ', u.first_surname, ' ', COALESCE(u.second_surname, ''))) AS empleado,
      u.email AS correo,
      u.email,
      COALESCE(u.phone, '') AS telefono,
      u.phone,
      TO_CHAR(u.date_of_birth, 'YYYY-MM-DD') AS fecha_nacimiento,
      u.position_id AS cargo_id,
      COALESCE(pos.name, '') AS cargo,
      u.area_id,
      COALESCE(ar.name, '') AS area,
      COALESCE(fl.name, '') AS piso,
      COALESCE(u.photo, '') AS foto_url,
      u.active::int AS activo,
      CASE WHEN u.active THEN 'activo' ELSE 'inactivo' END AS estado
    FROM users u
    LEFT JOIN document_details dd ON dd.user_id = u.id
    LEFT JOIN positions pos ON u.position_id = pos.id
    LEFT JOIN areas ar ON u.area_id = ar.id
    LEFT JOIN floors fl ON ar.floor_id = fl.id
    WHERE u.id = ?${excluirRolesPorUserId('u.id')}`,
    [id]
  );
  return rows[0];
};

exports.crear = async (data) => {
  const { cedula, nombre, apellido, correo, telefono, fecha_nacimiento, cargo_id, area_id } = data;
  const username = (nombre.toLowerCase().replace(/\s+/g, '') + '.' + (apellido || 'user').toLowerCase().replace(/\s+/g, '')).substring(0, 40) + Math.floor(Math.random() * 900 + 100);
  // Default password hash for 123456
  const passwordHash = "$2b$10$FnNwnu0sg.DOrspnoCm91.PVx/HHmKhXM7fUGh6i1mZQLN7JhIVR.";

  const [userRows, userResult] = await db.query(
    `INSERT INTO users (first_name, first_surname, email, phone, date_of_birth, position_id, area_id, username, password_hash, address, place_of_birth)
     VALUES (?, ?, ?, ?, COALESCE(?::date, '1990-01-01'::date), ?, ?, ?, ?, 'Valledupar', 'Valledupar')
     RETURNING id`,
    [nombre, apellido || '', correo, telefono || '0000000000', fecha_nacimiento || null, cargo_id, area_id, username, passwordHash]
  );
  const userId = userRows[0]?.id || userResult.insertId;

  if (cedula && userId) {
    await db.query(
      `INSERT INTO document_details (document_type_id, user_id, document_number, issue_date, place_of_issue)
       VALUES ('ea30fb17-5e1e-4c2f-bdc8-9bbb3210ca99', ?, ?, '2010-01-01', 'Valledupar')
       ON CONFLICT (user_id) DO UPDATE SET document_number = EXCLUDED.document_number`,
      [userId, cedula]
    );
  }

  // Assign Empleado role
  if (userId) {
    await db.query(
      `INSERT INTO user_roles (user_id, role_id) VALUES (?, '86b7792a-7786-4a15-91e3-ebdeec841992') ON CONFLICT DO NOTHING`,
      [userId]
    );
  }

  return userId;
};

exports.actualizar = async (id, data) => {
  const sets = [];
  const params = [];

  if (data.nombre !== undefined) { sets.push("first_name = ?"); params.push(data.nombre); }
  if (data.apellido !== undefined) { sets.push("first_surname = ?"); params.push(data.apellido); }
  if (data.correo !== undefined || data.email !== undefined) { sets.push("email = ?"); params.push(data.correo || data.email); }
  if (data.telefono !== undefined || data.phone !== undefined) { sets.push("phone = ?"); params.push(data.telefono || data.phone); }
  if (data.fecha_nacimiento !== undefined) { sets.push("date_of_birth = ?::date"); params.push(data.fecha_nacimiento); }
  if (data.cargo_id !== undefined) { sets.push("position_id = ?"); params.push(data.cargo_id); }
  if (data.area_id !== undefined) { sets.push("area_id = ?"); params.push(data.area_id); }
  if (data.foto_url !== undefined) { sets.push("photo = ?"); params.push(data.foto_url); }

  if (sets.length > 0) {
    params.push(id);
    await db.query(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`, params);
  }

  if (data.cedula) {
    await db.query(
      `INSERT INTO document_details (document_type_id, user_id, document_number, issue_date, place_of_issue)
       VALUES ('ea30fb17-5e1e-4c2f-bdc8-9bbb3210ca99', ?, ?, '2010-01-01', 'Valledupar')
       ON CONFLICT (user_id) DO UPDATE SET document_number = EXCLUDED.document_number`,
      [id, data.cedula]
    );
  }
};

exports.eliminar = async (id) => {
  await db.query("DELETE FROM users WHERE id = ?", [id]);
};
