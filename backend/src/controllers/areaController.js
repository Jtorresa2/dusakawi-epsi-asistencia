const db = require("../config/db");

exports.obtenerTodos = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM areas ORDER BY nombre ASC");
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al obtener las áreas" });
  }
};

exports.obtenerPorId = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM areas WHERE id = ?", [req.params.id]);
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
    const [result] = await db.query("INSERT INTO areas (nombre, piso, descripcion) VALUES (?, ?, ?)", [nombre, piso || 1, descripcion || ""]);
    res.status(201).json({ mensaje: "Área creada correctamente", id: result.insertId });
  } catch (error) {
    console.error(error);
    if (error.code === "ER_DUP_ENTRY") return res.status(400).json({ mensaje: "El nombre del área ya existe" });
    res.status(500).json({ mensaje: "Error al crear el área" });
  }
};

exports.actualizar = async (req, res) => {
  try {
    const { nombre, piso, descripcion } = req.body;
    await db.query("UPDATE areas SET nombre = ?, piso = ?, descripcion = ? WHERE id = ?", [nombre, piso, descripcion, req.params.id]);
    res.json({ mensaje: "Área actualizada correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al actualizar el área" });
  }
};

exports.eliminar = async (req, res) => {
  try {
    await db.query("DELETE FROM areas WHERE id = ?", [req.params.id]);
    res.json({ mensaje: "Área eliminada correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al eliminar el área" });
  }
};

exports.obtenerEmpleadosPorArea = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT e.*, c.nombre AS cargo FROM empleado e
       LEFT JOIN cargos c ON e.cargo_id = c.id
       WHERE e.area_id = ? ORDER BY e.nombre ASC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al obtener empleados del área" });
  }
};
