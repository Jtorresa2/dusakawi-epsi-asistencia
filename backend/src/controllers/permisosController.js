const permisoService = require("../services/permisoService");

exports.obtenerTodos = async (req, res) => {
  try {
    const permisos = await permisoService.obtenerTodos();
    res.json({ permisos });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al obtener los permisos" });
  }
};

exports.crear = async (req, res) => {
  try {
    const usuarioId = req.user?.id;
    const result = await permisoService.crear(req.body, usuarioId);
    res.status(201).json({
      mensaje: "Permiso registrado correctamente",
      id: result.id,
      dias_generados: result.dias_generados,
    });
  } catch (error) {
    console.error(error);
    if (error.message.includes("requeridos")) {
      return res.status(400).json({ mensaje: error.message });
    }
    res.status(500).json({ mensaje: "Error al registrar el permiso" });
  }
};
