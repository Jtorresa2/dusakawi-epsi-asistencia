const incidenciaService = require("../services/incidenciaService");

exports.crear = async (req, res) => {
  try {
    const { tipo, descripcion, fecha } = req.body;
    const empleado_id = req.user.empleado_id || req.user.id;
    const evidencia_url = req.file ? `/uploads/incidencias/${req.file.filename}` : null;
    const id = await incidenciaService.crear({ empleado_id, tipo, descripcion, evidencia_url, fecha });
    res.status(201).json({ mensaje: "Incidencia reportada correctamente", id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al reportar la incidencia" });
  }
};

exports.obtenerTodas = async (req, res) => {
  try {
    const filtros = {};
    if (req.user.rol === "empleado") filtros.empleado_id = req.user.empleado_id || req.user.id;
    if (req.query.estado) filtros.estado = req.query.estado;
    if (req.query.tipo) filtros.tipo = req.query.tipo;
    if (req.query.prioridad) filtros.prioridad = req.query.prioridad;
    if (req.query.area_id) filtros.area_id = req.query.area_id;
    if (req.query.cargo_id) filtros.cargo_id = req.query.cargo_id;
    if (req.query.fecha_desde) filtros.fecha_desde = req.query.fecha_desde;
    if (req.query.fecha_hasta) filtros.fecha_hasta = req.query.fecha_hasta;
    if (req.query.busqueda) filtros.busqueda = req.query.busqueda;
    const incidencias = await incidenciaService.obtenerTodas(filtros);
    res.json(incidencias);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al obtener incidencias" });
  }
};

exports.obtenerPorId = async (req, res) => {
  try {
    const incidencia = await incidenciaService.obtenerPorId(req.params.id);
    if (!incidencia) return res.status(404).json({ mensaje: "Incidencia no encontrada" });
    if (req.user.rol === "empleado" && incidencia.empleado_id !== (req.user.empleado_id || req.user.id)) {
      return res.status(403).json({ mensaje: "No tienes permiso" });
    }
    res.json(incidencia);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al obtener la incidencia" });
  }
};

exports.aprobar = async (req, res) => {
  try {
    const ok = await incidenciaService.aprobar(req.params.id, req.user.id);
    if (!ok) return res.status(400).json({ mensaje: "No se pudo aprobar. Puede que ya no esté pendiente." });
    res.json({ mensaje: "Incidencia aprobada" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al aprobar la incidencia" });
  }
};

exports.rechazar = async (req, res) => {
  try {
    const { motivo } = req.body;
    if (!motivo) return res.status(400).json({ mensaje: "Debes indicar el motivo del rechazo" });
    const ok = await incidenciaService.rechazar(req.params.id, motivo, req.user.id);
    if (!ok) return res.status(400).json({ mensaje: "No se pudo rechazar. Puede que ya no esté pendiente." });
    res.json({ mensaje: "Incidencia rechazada" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al rechazar la incidencia" });
  }
};

exports.aprobarConFirma = async (req, res) => {
  try {
    const archivo_firmado = req.file ? `/uploads/incidencias/firmas/${req.file.filename}` : null;
    if (!archivo_firmado) return res.status(400).json({ mensaje: "Debes adjuntar el PDF firmado" });
    const ok = await incidenciaService.aprobarConFirma(req.params.id, archivo_firmado, req.user.id);
    if (!ok) return res.status(400).json({ mensaje: "No se pudo aprobar. Puede que ya no esté pendiente." });
    res.json({ mensaje: "Incidencia aprobada con firma" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al aprobar con firma" });
  }
};

exports.solicitarCorreccion = async (req, res) => {
  try {
    const { observacion } = req.body;
    if (!observacion) return res.status(400).json({ mensaje: "Debes indicar una observación" });
    const ok = await incidenciaService.solicitarCorreccion(req.params.id, observacion, req.user.id);
    if (!ok) return res.status(400).json({ mensaje: "No se pudo solicitar corrección. Puede que ya no esté pendiente." });
    res.json({ mensaje: "Corrección solicitada" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al solicitar corrección" });
  }
};

exports.eliminar = async (req, res) => {
  try {
    await incidenciaService.eliminar(req.params.id);
    res.json({ mensaje: "Incidencia eliminada" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al eliminar la incidencia" });
  }
};

// GET /api/incidencias/stats — conteos por estado
exports.obtenerStats = async (req, res) => {
  try {
    const pool = require("../config/db");
    const [rows] = await pool.query(`
      SELECT 
        SUM((estado = 'pendiente')::int) AS pendientes,
        SUM((estado = 'aprobado')::int) AS aprobadas,
        SUM((estado = 'rechazado')::int) AS rechazadas
      FROM incidencias
    `);
    res.json(rows[0] || { pendientes: 0, aprobadas: 0, rechazadas: 0 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al obtener estadísticas" });
  }
};

// GET /api/incidencias/activity — actividad reciente (últimas 10 acciones)
exports.obtenerActividad = async (req, res) => {
  try {
    const pool = require("../config/db");
    const [rows] = await pool.query(`
      SELECT i.id, i.estado, i.tipo, i.created_at, i.updated_at, i.fecha,
        e.nombre AS empleado_nombre, e.apellido AS empleado_apellido
      FROM incidencias i
      JOIN empleado e ON i.empleado_id = e.id
      ORDER BY i.updated_at DESC
      LIMIT 10
    `);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al obtener actividad" });
  }
};