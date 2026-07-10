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
    if (req.query.fecha_desde) filtros.fecha_desde = req.query.fecha_desde;
    if (req.query.fecha_hasta) filtros.fecha_hasta = req.query.fecha_hasta;
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