const novedadesService = require("../services/novedadesService");

exports.obtenerTodos = async (req, res) => {
  try {
    const novedades = await novedadesService.obtenerTodos();
    res.json({ novedades });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al obtener las novedades" });
  }
};

exports.crear = async (req, res) => {
  try {
    const usuarioId = req.user?.id;
    const result = await novedadesService.crear(req.body, usuarioId);
    res.status(201).json({
      mensaje: "Novedad registrada correctamente",
      id: result.id,
      dias_generados: result.dias_generados,
    });
  } catch (error) {
    console.error(error);
    if (error.message.includes("requeridos")) {
      return res.status(400).json({ mensaje: error.message });
    }
    res.status(500).json({ mensaje: "Error al registrar la novedad" });
  }
};

exports.actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    await novedadesService.actualizar(id, req.body, req.user?.id);
    res.json({ mensaje: "Novedad actualizada correctamente" });
  } catch (error) {
    console.error(error);
    if (error.message.includes("requeridos")) {
      return res.status(400).json({ mensaje: error.message });
    }
    res.status(500).json({ mensaje: "Error al actualizar la novedad" });
  }
};

exports.eliminar = async (req, res) => {
  try {
    const { id } = req.params;
    await novedadesService.eliminar(id);
    res.json({ mensaje: "Novedad eliminada correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al eliminar la novedad" });
  }
};

exports.mios = async (req, res) => {
  try {
    const empleadoId = req.user?.empleado_id;
    if (!empleadoId) return res.status(400).json({ mensaje: "empleado_id no encontrado" });
    const novedades = await novedadesService.obtenerPorEmpleado(empleadoId);
    res.json({ novedades });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al obtener mis novedades" });
  }
};
