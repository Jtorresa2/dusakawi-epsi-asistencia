const personalService = require("../services/personalService");

exports.obtenerTodos = async (req, res) => {
  try {
    const filtros = {};
    if (req.query.area) filtros.area = req.query.area;
    if (req.query.cargo) filtros.cargo = req.query.cargo;
    const empleados = await personalService.obtenerTodos(filtros);
    res.json({ empleados });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al obtener los empleados" });
  }
};

exports.obtenerPorId = async (req, res) => {
  try {
    const empleado = await personalService.obtenerPorId(req.params.id);
    if (!empleado) return res.status(404).json({ mensaje: "Empleado no encontrado" });
    res.json(empleado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al obtener el empleado" });
  }
};

exports.crear = async (req, res) => {
  try {
    // Only admin may create admin users; prevents talento_humano escalation.
    if (req.user?.rol !== "admin" && Number(req.body.rol_id) === 1) {
      return res.status(403).json({ mensaje: "Solo el administrador puede crear usuarios administradores" });
    }

    const result = await personalService.crear(req.body);
    const msg = result.password
      ? `Empleado creado correctamente. Usuario: ${result.username}, Contraseña: ${result.password}`
      : "Empleado creado correctamente";
    res.status(201).json({ mensaje: msg, id: result.id, password: result.password, username: result.username });
  } catch (error) {
    console.error(error);
    if (error.code === "VALIDACION") {
      return res.status(400).json({ mensaje: error.message });
    }
    if (error.code === "23505") {
      return res.status(400).json({ mensaje: "La cédula o correo ya están registrados" });
    }
    res.status(500).json({ mensaje: "Error al crear el empleado" });
  }
};

exports.actualizar = async (req, res) => {
  try {
    // Any authenticated user may update their own profile; admin/TH may update
    // anyone. Keeps MiPerfilPage (PUT /api/empleados/:id) working for empleados
    // while preserving the admin/TH management surface.
    if (String(req.params.id) !== String(req.user?.id) && !["admin", "talento_humano"].includes(req.user?.rol)) {
      return res.status(403).json({ mensaje: "No autorizado" });
    }

    // Only admin may change rol_id; prevents talento_humano self-escalation.
    if (req.user?.rol !== "admin" && req.body.rol_id !== undefined) {
      delete req.body.rol_id;
    }

    await personalService.actualizar(req.params.id, req.body);
    res.json({ mensaje: "Empleado actualizado correctamente" });
  } catch (error) {
    console.error(error);
    if (error.code === "VALIDACION") {
      return res.status(400).json({ mensaje: error.message });
    }
    res.status(500).json({ mensaje: "Error al actualizar el empleado" });
  }
};

exports.eliminar = async (req, res) => {
  try {
    await personalService.eliminar(req.params.id);
    res.json({ mensaje: "Empleado eliminado correctamente" });
  } catch (error) {
    console.error(error);
    if (error.code === "23503") {
      return res.status(400).json({ mensaje: "No se puede eliminar el empleado porque tiene registros asociados" });
    }
    res.status(500).json({ mensaje: "Error al eliminar el empleado" });
  }
};
