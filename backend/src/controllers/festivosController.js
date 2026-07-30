const festivoService = require("../services/festivoService");

exports.obtenerTodos = async (req, res) => {
  try {
    const activo = req.query.activo !== undefined ? req.query.activo === "true" : null;
    const festivos = await festivoService.obtenerTodos(activo);
    res.json({ festivos });
  } catch (err) {
    res.status(500).json({ mensaje: "Error del servidor", error: err.message });
  }
};

exports.crear = async (req, res) => {
  try {
    const { fecha, nombre, tipo } = req.body;
    if (!fecha || !nombre) {
      return res.status(400).json({ mensaje: "fecha y nombre son requeridos" });
    }
    const resultado = await festivoService.crear({ fecha, nombre, tipo });
    res.status(201).json({ mensaje: "Festivo creado", festivo: resultado });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY" || err.message?.includes("duplicate")) {
      return res.status(409).json({ mensaje: "Ya existe un festivo en esa fecha" });
    }
    res.status(500).json({ mensaje: "Error del servidor", error: err.message });
  }
};

exports.actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const resultado = await festivoService.actualizar(id, req.body);
    res.json({ mensaje: "Festivo actualizado", festivo: resultado });
  } catch (err) {
    res.status(500).json({ mensaje: "Error del servidor", error: err.message });
  }
};

exports.eliminar = async (req, res) => {
  try {
    await festivoService.eliminar(req.params.id);
    res.json({ mensaje: "Festivo eliminado" });
  } catch (err) {
    res.status(500).json({ mensaje: "Error del servidor", error: err.message });
  }
};

exports.verificar = async (req, res) => {
  try {
    const { fecha } = req.query;
    if (!fecha) return res.status(400).json({ mensaje: "fecha es requerida" });
    const festivo = await festivoService.verificarFestivo(fecha);
    res.json({ esFestivo: !!festivo, festivo });
  } catch (err) {
    res.status(500).json({ mensaje: "Error del servidor", error: err.message });
  }
};

exports.generar = async (req, res) => {
  try {
    const { year } = req.body;
    if (!year) return res.status(400).json({ mensaje: "Año es requerido" });
    const resultado = await festivoService.generarNacionales(Number(year));
    res.json({
      mensaje: `Festivos generados: ${resultado.insertados} nuevo(s), ${resultado.existentes} ya existente(s)`,
      ...resultado,
    });
  } catch (err) {
    res.status(500).json({ mensaje: "Error del servidor", error: err.message });
  }
};
