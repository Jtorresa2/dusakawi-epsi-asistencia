const pool = require("../config/db");
const fs = require("fs");
const path = require("path");
const calculoHorario = require("./calculoHorarioService");

const UPLOADS_DIR = path.join(__dirname, "../../uploads");

exports.crear = async ({ usuario_id, tipo, descripcion, evidencia_url, fecha }) => {
  if (!usuario_id) throw new Error("usuario_id es requerido");
  const { rows: [nuevo] } = await pool.query(
    `INSERT INTO incidencias (usuario_id, tipo, descripcion, evidencia_url, fecha, estado)
     VALUES ($1, $2, $3, $4, $5, 'pendiente') RETURNING id`,
    [usuario_id, tipo, descripcion, evidencia_url, fecha]
  );
  return nuevo?.id ?? 0;
};

exports.obtenerTodas = async (filtros = {}) => {
  let sql = `
    SELECT i.*, u.nombre as empleado_nombre, u.cedula, u.apellido,
      ar.nombre AS area,
      c.nombre AS cargo
    FROM incidencias i
    LEFT JOIN usuarios u ON i.usuario_id = u.id
    LEFT JOIN areas ar ON u.area_id = ar.id
    LEFT JOIN cargos c ON u.cargo_id = c.id
    WHERE 1=1
  `;
  const params = [];
  if (filtros.usuario_id) { sql += " AND i.usuario_id = $1"; params.push(filtros.usuario_id); }
  else if (filtros.empleado_id) { sql += " AND i.usuario_id = $1"; params.push(filtros.empleado_id); }
  if (filtros.estado) { sql += ` AND i.estado = $${params.length}`; params.push(filtros.estado); }
  if (filtros.tipo) { sql += ` AND i.tipo = $${params.length}`; params.push(filtros.tipo); }
  if (filtros.prioridad) { sql += ` AND i.prioridad = $${params.length}`; params.push(filtros.prioridad); }
  if (filtros.area_id) { sql += ` AND u.area_id = $${params.length}`; params.push(filtros.area_id); }
  if (filtros.cargo_id) { sql += ` AND u.cargo_id = $${params.length}`; params.push(filtros.cargo_id); }
  if (filtros.fecha_desde) { sql += ` AND i.fecha >= $${params.length}`; params.push(filtros.fecha_desde); }
  if (filtros.fecha_hasta) { sql += ` AND i.fecha <= $${params.length}`; params.push(filtros.fecha_hasta); }
  if (filtros.busqueda) {
    sql += ` AND (u.nombre LIKE $${params.length} OR u.apellido LIKE $${params.length + 1} OR u.cedula LIKE $${params.length + 2})`;
    const term = `%${filtros.busqueda}%`;
    params.push(term, term, term);
  }
  sql += " ORDER BY i.created_at DESC";
  const { rows } = await pool.query(sql, params);
  return rows;
};

exports.obtenerPorId = async (id) => {
  const { rows } = await pool.query(
    `SELECT i.*,
      u.nombre AS empleado_nombre, u.cedula, u.apellido,
      ar.nombre AS area,
      c.nombre AS cargo,
      CONCAT(er.nombre, ' ', er.apellido) AS revisor_nombre
     FROM incidencias i
     LEFT JOIN usuarios u ON i.usuario_id = u.id
     LEFT JOIN areas ar ON u.area_id = ar.id
     LEFT JOIN cargos c ON u.cargo_id = c.id
     LEFT JOIN usuarios er ON i.revisado_por = er.id
     WHERE i.id = $1`,
    [id]
  );
  const incidencia = rows[0] || null;
  if (incidencia) {
    incidencia.asistencia = await exports.obtenerAsistenciaRelacionada(incidencia.usuario_id, incidencia.fecha);
  }
  return incidencia;
};

exports.obtenerAsistenciaRelacionada = async (usuarioId, fecha) => {
  try {
    const diaSemana = calculoHorario.diaSemanaDeFecha(fecha);
    const { rows } = await pool.query(
      `SELECT
        a.fecha_hora_entrada,
        a.fecha_hora_salida,
        a.minutos_tardanza,
        a.tipo_marcacion,
        a.estado AS estado_marcacion,
        h.modalidad,
        TO_CHAR(hd.hora_entrada_manana, 'HH24:MI') AS hora_entrada_programada,
        TO_CHAR(hd.hora_salida_manana, 'HH24:MI') AS hora_salida_programada
       FROM asistencia a
       LEFT JOIN usuarios u ON a.usuario_id = u.id
       LEFT JOIN horarios h ON u.horario_id = h.id
       LEFT JOIN horario_detalle hd ON h.id = hd.horario_id AND hd.dia_semana = $1
       WHERE a.usuario_id = $2 AND a.fecha = $3
       GROUP BY a.id, h.modalidad, hd.hora_entrada_manana, hd.hora_salida_manana`,
      [diaSemana, usuarioId, fecha]
    );
    const fila = rows[0] || null;
    if (fila && (fila.modalidad === "flexible" || fila.modalidad === "por_horas")) {
      fila.minutos_tardanza = 0;
    }
    return fila;
  } catch {
    return null;
  }
};

exports.aprobar = async (id, prioridad, revisado_por) => {
  const { rowCount } = await pool.query(
    "UPDATE incidencias SET estado = 'aprobado', prioridad = $1, revisado_por = $2 WHERE id = $3 AND estado IN ('pendiente','en_revision')",
    [prioridad || 'media', revisado_por, id]
  );
  return rowCount > 0;
};

exports.aprobarConFirma = async (id, archivo_firmado, prioridad, revisado_por) => {
  const { rowCount } = await pool.query(
    "UPDATE incidencias SET estado = 'aprobado', archivo_firmado = $1, prioridad = $2, revisado_por = $3 WHERE id = $4 AND estado IN ('pendiente','en_revision')",
    [archivo_firmado, prioridad || 'media', revisado_por, id]
  );
  return rowCount > 0;
};

exports.rechazar = async (id, motivo, revisado_por) => {
  const { rowCount } = await pool.query(
    "UPDATE incidencias SET estado = 'rechazado', motivo_rechazo = $1, revisado_por = $2 WHERE id = $3 AND estado IN ('pendiente','en_revision')",
    [motivo, revisado_por, id]
  );
  return rowCount > 0;
};

exports.solicitarCorreccion = async (id, observacion, revisado_por) => {
  const { rowCount } = await pool.query(
    "UPDATE incidencias SET observacion = $1, revisado_por = $2 WHERE id = $3 AND estado IN ('pendiente','en_revision')",
    [observacion, revisado_por, id]
  );
  return rowCount > 0;
};

exports.eliminar = async (id) => {
  const { rows } = await pool.query("SELECT evidencia_url, archivo_firmado FROM incidencias WHERE id = $1", [id]);
  const inc = rows[0];
  if (inc) {
    for (const url of [inc.evidencia_url, inc.archivo_firmado]) {
      if (url) {
        const filePath = path.join(UPLOADS_DIR, url.replace("/uploads/", ""));
        try { fs.unlinkSync(filePath); } catch {}
      }
    }
  }
  await pool.query("DELETE FROM incidencias WHERE id = $1", [id]);

  const { rows: countResult } = await pool.query("SELECT COUNT(*) AS count FROM incidencias");
  if (countResult[0].count === 0) {
    await pool.query("ALTER SEQUENCE incidencias_id_seq RESTART WITH 1");
  }
};