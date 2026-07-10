const pool = require("../config/db");

exports.crear = async ({ empleado_id, tipo, descripcion, evidencia_url, fecha }) => {
  const [result] = await pool.query(
    `INSERT INTO incidencias (empleado_id, tipo, descripcion, evidencia_url, fecha, estado)
     VALUES (?, ?, ?, ?, ?, 'pendiente')`,
    [empleado_id, tipo, descripcion, evidencia_url, fecha]
  );
  return result.insertId;
};

exports.obtenerTodas = async (filtros = {}) => {
  let sql = `
    SELECT i.*, e.nombre as empleado_nombre, e.cedula
    FROM incidencias i
    LEFT JOIN empleados e ON i.empleado_id = e.id
    WHERE 1=1
  `;
  const params = [];
  if (filtros.empleado_id) { sql += " AND i.empleado_id = ?"; params.push(filtros.empleado_id); }
  if (filtros.estado) { sql += " AND i.estado = ?"; params.push(filtros.estado); }
  if (filtros.tipo) { sql += " AND i.tipo = ?"; params.push(filtros.tipo); }
  if (filtros.fecha_desde) { sql += " AND i.fecha >= ?"; params.push(filtros.fecha_desde); }
  if (filtros.fecha_hasta) { sql += " AND i.fecha <= ?"; params.push(filtros.fecha_hasta); }
  sql += " ORDER BY i.created_at DESC";
  const [rows] = await pool.query(sql, params);
  return rows;
};

exports.obtenerPorId = async (id) => {
  const [rows] = await pool.query(
    `SELECT i.*, e.nombre as empleado_nombre, e.cedula
     FROM incidencias i
     LEFT JOIN empleados e ON i.empleado_id = e.id
     WHERE i.id = ?`,
    [id]
  );
  return rows[0] || null;
};

exports.aprobar = async (id, revisado_por) => {
  const [result] = await pool.query(
    "UPDATE incidencias SET estado = 'aprobado', revisado_por = ? WHERE id = ? AND estado = 'pendiente'",
    [revisado_por, id]
  );
  return result.affectedRows > 0;
};

exports.rechazar = async (id, motivo, revisado_por) => {
  const [result] = await pool.query(
    "UPDATE incidencias SET estado = 'rechazado', motivo_rechazo = ?, revisado_por = ? WHERE id = ? AND estado = 'pendiente'",
    [motivo, revisado_por, id]
  );
  return result.affectedRows > 0;
};