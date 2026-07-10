const cargoService = require("../services/cargoService");

exports.obtenerTodos = async (req, res) => {
  try {
    const cargos = await cargoService.obtenerTodos();
    res.json(cargos);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: "Error al obtener los cargos",
    });
  }
};

exports.obtenerPorId = async (req, res) => {
  try {
    const cargo = await cargoService.obtenerPorId(req.params.id);

    if (!cargo) {
      return res.status(404).json({
        mensaje: "Cargo no encontrado",
      });
    }

    res.json(cargo);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: "Error al obtener el cargo",
    });
  }
};

exports.crear = async (req, res) => {
  try {
    const id = await cargoService.crear(req.body);

    res.status(201).json({
      mensaje: "Cargo creado correctamente",
      id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: "Error al crear el cargo",
    });
  }
};

exports.actualizar = async (req, res) => {
  try {
    await cargoService.actualizar(req.params.id, req.body);

    res.json({
      mensaje: "Cargo actualizado correctamente",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: "Error al actualizar el cargo",
    });
  }
};

exports.eliminar = async (req, res) => {
  try {
    await cargoService.eliminar(req.params.id);

    res.json({
      mensaje: "Cargo eliminado correctamente",
    });
  } catch (error) {
    console.error(error);

    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(400).json({
        mensaje: "No se puede eliminar el cargo porque está asignado a uno o más empleados.",
      });
    }

    res.status(500).json({
      mensaje: "Error al eliminar el cargo",
    });
  }
};