const pool = require("../config/db");
const fs = require("fs");
const path = require("path");

const UPLOADS_DIR = path.join(__dirname, "../../uploads");

exports.crear = async ({ empleado_id, tipo, descripcion, evidencia_url, fecha, prioridad }) => {
  const createdAt = fecha ? `${fecha} 12:00:00+00` : null;
  const [rows, result] = await pool.query(
    `INSERT INTO incidents (user_id, type, description, evidence, priority, status, created_at)
     VALUES (?, ?, ?, ?, COALESCE(?, 'Media'), 'Pendiente', COALESCE(?::timestamptz, NOW()))
     RETURNING id`,
    [empleado_id, tipo, descripcion, evidencia_url || null, prioridad || 'Media', createdAt]
  );
  return rows[0]?.id || result.insertId;
};

exports.obtenerTodas = async (filtros = {}) => {
  let sql = `
    SELECT
      i.id,
      i.user_id,
      i.user_id AS empleado_id,
      TRIM(CONCAT(u.first_name, ' ', COALESCE(u.middle_name, ''), ' ', u.first_surname, ' ', COALESCE(u.second_surname, ''))) AS empleado,
      TRIM(CONCAT(u.first_name, ' ', u.first_surname)) AS empleado_nombre,
      COALESCE(dd.document_number, '') AS cedula,
      COALESCE(pos.name, '') AS cargo,
      COALESCE(ar.name, '') AS area,
      i.type AS tipo,
      i.description AS descripcion,
      i.status AS estado,
      i.status,
      i.priority AS prioridad,
      i.priority,
      i.evidence AS evidencia,
      i.evidence AS evidencia_url,
      i.observation AS observacion,
      i.rejection_reason AS motivo_rechazo,
      i.signed_file AS archivo_firmado,
      i.reviewed_by,
      TRIM(CONCAT(ur.first_name, ' ', ur.first_surname)) AS responsable,
      TRIM(CONCAT(ur.first_name, ' ', ur.first_surname)) AS revisor_nombre,
      TO_CHAR(i.created_at, 'YYYY-MM-DD') AS fecha,
      i.created_at
    FROM incidents i
    JOIN users u ON i.user_id = u.id
    LEFT JOIN document_details dd ON dd.user_id = u.id
    LEFT JOIN positions pos ON u.position_id = pos.id
    LEFT JOIN areas ar ON u.area_id = ar.id
    LEFT JOIN users ur ON i.reviewed_by = ur.id
    WHERE 1=1
  `;
  const params = [];
  if (filtros.empleado_id) { sql += " AND i.user_id = ?"; params.push(filtros.empleado_id); }
  if (filtros.estado) { sql += " AND LOWER(i.status) = LOWER(?)"; params.push(filtros.estado); }
  if (filtros.tipo) { sql += " AND LOWER(i.type) = LOWER(?)"; params.push(filtros.tipo); }
  if (filtros.prioridad) { sql += " AND LOWER(i.priority) = LOWER(?)"; params.push(filtros.prioridad); }
  if (filtros.area_id) { sql += " AND u.area_id = ?"; params.push(filtros.area_id); }
  if (filtros.cargo_id) { sql += " AND u.position_id = ?"; params.push(filtros.cargo_id); }
  if (filtros.fecha_desde) { sql += " AND DATE(i.created_at) >= ?"; params.push(filtros.fecha_desde); }
  if (filtros.fecha_hasta) { sql += " AND DATE(i.created_at) <= ?"; params.push(filtros.fecha_hasta); }
  if (filtros.busqueda) {
    sql += " AND (u.first_name ILIKE ? OR u.first_surname ILIKE ? OR dd.document_number ILIKE ?)";
    const term = `%${filtros.busqueda}%`;
    params.push(term, term, term);
  }
  sql += " ORDER BY i.created_at DESC";
  const [rows] = await pool.query(sql, params);
  return rows;
};

exports.obtenerPorId = async (id) => {
  const [rows] = await pool.query(
    `SELECT
      i.id,
      i.user_id,
      i.user_id AS empleado_id,
      TRIM(CONCAT(u.first_name, ' ', COALESCE(u.middle_name, ''), ' ', u.first_surname, ' ', COALESCE(u.second_surname, ''))) AS empleado,
      TRIM(CONCAT(u.first_name, ' ', u.first_surname)) AS empleado_nombre,
      COALESCE(dd.document_number, '') AS cedula,
      COALESCE(pos.name, '') AS cargo,
      COALESCE(ar.name, '') AS area,
      i.type AS tipo,
      i.description AS descripcion,
      i.status AS estado,
      i.status,
      i.priority AS prioridad,
      i.priority,
      i.evidence AS evidencia,
      i.evidence AS evidencia_url,
      i.observation AS observacion,
      i.rejection_reason AS motivo_rechazo,
      i.signed_file AS archivo_firmado,
      i.reviewed_by,
      TRIM(CONCAT(ur.first_name, ' ', ur.first_surname)) AS responsable,
      TRIM(CONCAT(ur.first_name, ' ', ur.first_surname)) AS revisor_nombre,
      TO_CHAR(i.created_at, 'YYYY-MM-DD') AS fecha,
      i.created_at
     FROM incidents i
     JOIN users u ON i.user_id = u.id
     LEFT JOIN document_details dd ON dd.user_id = u.id
     LEFT JOIN positions pos ON u.position_id = pos.id
     LEFT JOIN areas ar ON u.area_id = ar.id
     LEFT JOIN users ur ON i.reviewed_by = ur.id
     WHERE i.id = ?`,
    [id]
  );
  const incidencia = rows[0] || null;
  if (incidencia) {
    incidencia.asistencia = await exports.obtenerAsistenciaRelacionada(incidencia.user_id, incidencia.fecha);
  }
  return incidencia;
};

exports.obtenerAsistenciaRelacionada = async (userId, fecha) => {
  try {
    const [rows] = await pool.query(
      `SELECT
        a.first_entry_time AS fecha_hora_entrada,
        a.last_departure_time AS fecha_hora_salida,
        a.minutos_tardanza,
        a.tipo_marcacion,
        a.estado AS estado_marcacion,
        TO_CHAR(MIN(hd.hora_entrada_manana), 'HH24:MI') AS hora_entrada_programada,
        TO_CHAR(MIN(hd.hora_salida_manana), 'HH24:MI') AS hora_salida_programada
       FROM attendances a
       LEFT JOIN horario_detalle hd ON hd.horario_id = 1
       WHERE a.user_id = ? AND DATE(a.created_at) = ?::date
       GROUP BY a.id, a.first_entry_time, a.last_departure_time, a.minutos_tardanza, a.tipo_marcacion, a.estado`,
      [userId, fecha]
    );
    return rows[0] || null;
  } catch {
    return null;
  }
};

exports.aprobar = async (id, revisado_por, observacion) => {
  const [rows, result] = await pool.query(
    "UPDATE incidents SET status = 'Aprobada', observation = COALESCE(?, observation), reviewed_by = ?, updated_at = NOW() WHERE id = ? AND LOWER(status) IN ('pendiente','en_revision')",
    [observacion || 'Aprobada', revisado_por, id]
  );
  return Boolean(result?.affectedRows > 0);
};

exports.aprobarConFirma = async (id, archivo_firmado, revisado_por) => {
  const [rows, result] = await pool.query(
    "UPDATE incidents SET status = 'Aprobada', signed_file = ?, reviewed_by = ?, updated_at = NOW() WHERE id = ? AND LOWER(status) IN ('pendiente','en_revision')",
    [archivo_firmado, revisado_por, id]
  );
  return Boolean(result?.affectedRows > 0);
};

exports.rechazar = async (id, motivo, revisado_por) => {
  const [rows, result] = await pool.query(
    "UPDATE incidents SET status = 'Rechazada', rejection_reason = ?, reviewed_by = ?, updated_at = NOW() WHERE id = ? AND LOWER(status) IN ('pendiente','en_revision')",
    [motivo, revisado_por, id]
  );
  return Boolean(result?.affectedRows > 0);
};

exports.solicitarCorreccion = async (id, observacion, revisado_por) => {
  const [rows, result] = await pool.query(
    "UPDATE incidents SET status = 'En Revisión', observation = ?, reviewed_by = ?, updated_at = NOW() WHERE id = ? AND LOWER(status) IN ('pendiente','en_revision')",
    [observacion, revisado_por, id]
  );
  return Boolean(result?.affectedRows > 0);
};

exports.eliminar = async (id) => {
  const [rows] = await pool.query("SELECT evidence, signed_file FROM incidents WHERE id = ?", [id]);
  const inc = rows[0];
  if (inc) {
    for (const url of [inc.evidence, inc.signed_file]) {
      if (url) {
        const filePath = path.join(UPLOADS_DIR, url.replace("/uploads/", ""));
        try { fs.unlinkSync(filePath); } catch {}
      }
    }
  }
  await pool.query("DELETE FROM incidents WHERE id = ?", [id]);
};