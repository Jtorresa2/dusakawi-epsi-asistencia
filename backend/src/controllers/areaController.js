const db = require("../config/db");

exports.obtenerTodos = async (req, res) => {
  try {
    const { rows } = await db.query("SELECT * FROM areas ORDER BY nombre ASC");
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al obtener las áreas" });
  }
};

exports.obtenerPorId = async (req, res) => {
  try {
    const { rows } = await db.query("SELECT * FROM areas WHERE id = $1", [req.params.id]);
    if (!rows[0]) return res.status(404).json({ mensaje: "Área no encontrada" });
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al obtener el área" });
  }
};

exports.crear = async (req, res) => {
  try {
    const { nombre, piso, descripcion } = req.body;
    const { rows: [nuevo] } = await db.query("INSERT INTO areas (nombre, piso, descripcion) VALUES ($1, $2, $3) RETURNING id", [nombre, piso || 1, descripcion || ""]);
    res.status(201).json({ mensaje: "Área creada correctamente", id: nuevo?.id ?? 0 });
  } catch (error) {
    console.error(error);
    if (error.code === "23505") return res.status(400).json({ mensaje: "El nombre del área ya existe" });
    res.status(500).json({ mensaje: "Error al crear el área" });
  }
};

exports.actualizar = async (req, res) => {
  try {
    const { nombre, piso, descripcion } = req.body;
    await db.query("UPDATE areas SET nombre = $1, piso = $2, descripcion = $3 WHERE id = $4", [nombre, piso, descripcion, req.params.id]);
    res.json({ mensaje: "Área actualizada correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al actualizar el área" });
  }
};

exports.eliminar = async (req, res) => {
  try {
    await db.query("DELETE FROM areas WHERE id = $1", [req.params.id]);
    res.json({ mensaje: "Área eliminada correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al eliminar el área" });
  }
};

exports.obtenerEmpleadosPorArea = async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT u.id, u.cedula, u.nombre, u.apellido, u.correo, u.telefono,
              u.fecha_nacimiento, u.cargo_id, u.area_id, u.horario_id,
              u.piso, u.fecha_ingreso, u.activo, u.rol_id, u.creado_en,
              c.nombre AS cargo
       FROM usuarios u
       LEFT JOIN cargos c ON u.cargo_id = c.id
       WHERE u.area_id = $1 ORDER BY u.nombre ASC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al obtener empleados del área" });
  }
};
