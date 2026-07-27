const empleadoService = require("../services/empleadoService");

exports.obtenerTodos = async (req, res) => {
  try {
    const filtros = {};
    if (req.query.area) filtros.area = req.query.area;
    if (req.query.cargo) filtros.cargo = req.query.cargo;
    const empleados = await empleadoService.obtenerTodos(filtros);
    res.json({ empleados });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al obtener los empleados" });
  }
};

exports.obtenerPorId = async (req, res) => {
  try {
    const empleado = await empleadoService.obtenerPorId(req.params.id);
    if (!empleado) return res.status(404).json({ mensaje: "Empleado no encontrado" });
    res.json(empleado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al obtener el empleado" });
  }
};

exports.crear = async (req, res) => {
  try {
    const id = await empleadoService.crear(req.body);
    res.status(201).json({ mensaje: "Empleado creado correctamente", id });
  } catch (error) {
    console.error(error);
    if (error.code === "23505") {
      return res.status(400).json({ mensaje: "La cédula o correo ya están registrados" });
    }
    res.status(500).json({ mensaje: "Error al crear el empleado" });
  }
};

exports.actualizar = async (req, res) => {
  try {
    await empleadoService.actualizar(req.params.id, req.body);
    res.json({ mensaje: "Empleado actualizado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al actualizar el empleado" });
  }
};

exports.eliminar = async (req, res) => {
  try {
    await empleadoService.eliminar(req.params.id);
    res.json({ mensaje: "Empleado eliminado correctamente" });
  } catch (error) {
    console.error(error);
    if (error.code === "23503") {
      return res.status(400).json({ mensaje: "No se puede eliminar el empleado porque tiene registros asociados" });
    }
    res.status(500).json({ mensaje: "Error al eliminar el empleado" });
  }
};
