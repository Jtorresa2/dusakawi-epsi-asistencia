const pool = require("../config/db");
const fs = require("fs");
const path = require("path");

const UPLOADS_DIR = path.join(__dirname, "../../uploads");

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
    SELECT i.*, e.nombre as empleado_nombre, e.cedula,
      ar.nombre AS area,
      c.nombre AS cargo
    FROM incidencias i
    LEFT JOIN empleado e ON i.empleado_id = e.id
    LEFT JOIN areas ar ON e.area_id = ar.id
    LEFT JOIN cargos c ON e.cargo_id = c.id
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
    `SELECT i.*,
      e.nombre AS empleado_nombre, e.cedula, e.apellido,
      ar.nombre AS area,
      c.nombre AS cargo,
      CONCAT(er.nombre, ' ', er.apellido) AS revisor_nombre
     FROM incidencias i
     LEFT JOIN empleado e ON i.empleado_id = e.id
     LEFT JOIN areas ar ON e.area_id = ar.id
     LEFT JOIN cargos c ON e.cargo_id = c.id
     LEFT JOIN usuarios ur ON i.revisado_por = ur.id
     LEFT JOIN empleado er ON ur.empleado_id = er.id
     WHERE i.id = ?`,
    [id]
  );
  const incidencia = rows[0] || null;
  if (incidencia) {
    incidencia.asistencia = await exports.obtenerAsistenciaRelacionada(incidencia.empleado_id, incidencia.fecha);
  }
  return incidencia;
};

exports.obtenerAsistenciaRelacionada = async (empleadoId, fecha) => {
  try {
    const [rows] = await pool.query(
      `SELECT
        a.fecha_hora_entrada,
        a.fecha_hora_salida,
        a.minutos_tardanza,
        a.tipo_marcacion,
        a.estado AS estado_marcacion,
        TIME_FORMAT(MIN(hd.hora_entrada_manana), '%H:%i') AS hora_entrada_programada,
        TIME_FORMAT(MIN(hd.hora_salida_manana), '%H:%i') AS hora_salida_programada
       FROM asistencia a
       LEFT JOIN empleado e ON a.empleado_id = e.id
       LEFT JOIN horario_detalle hd ON e.horario_id = hd.horario_id
       WHERE a.empleado_id = ? AND a.fecha = ?
       GROUP BY a.id`,
      [empleadoId, fecha]
    );
    return rows[0] || null;
  } catch {
    return null;
  }
};

exports.aprobar = async (id, revisado_por) => {
  const [result] = await pool.query(
    "UPDATE incidencias SET estado = 'aprobado', revisado_por = ? WHERE id = ? AND estado = 'pendiente'",
    [revisado_por, id]
  );
  return result.affectedRows > 0;
};

exports.aprobarConFirma = async (id, archivo_firmado, revisado_por) => {
  const [result] = await pool.query(
    "UPDATE incidencias SET estado = 'aprobado', archivo_firmado = ?, revisado_por = ? WHERE id = ? AND estado = 'pendiente'",
    [archivo_firmado, revisado_por, id]
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

exports.solicitarCorreccion = async (id, observacion, revisado_por) => {
  const [result] = await pool.query(
    "UPDATE incidencias SET observacion = ?, revisado_por = ? WHERE id = ? AND estado = 'pendiente'",
    [observacion, revisado_por, id]
  );
  return result.affectedRows > 0;
};

exports.eliminar = async (id) => {
  const [rows] = await pool.query("SELECT evidencia_url, archivo_firmado FROM incidencias WHERE id = ?", [id]);
  const inc = rows[0];
  if (inc) {
    for (const url of [inc.evidencia_url, inc.archivo_firmado]) {
      if (url) {
        const filePath = path.join(UPLOADS_DIR, url.replace("/uploads/", ""));
        try { fs.unlinkSync(filePath); } catch {}
      }
    }
  }
  await pool.query("DELETE FROM incidencias WHERE id = ?", [id]);

  const [countResult] = await pool.query("SELECT COUNT(*) AS count FROM incidencias");
  if (countResult[0].count === 0) {
    await pool.query("ALTER TABLE incidencias AUTO_INCREMENT = 1");
  }
};