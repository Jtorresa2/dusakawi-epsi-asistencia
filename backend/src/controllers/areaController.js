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
    const [rows, result] = await db.query("INSERT INTO areas (nombre, piso, descripcion) VALUES (?, ?, ?) RETURNING id", [nombre, piso || 1, descripcion || ""]);
    res.status(201).json({ mensaje: "Área creada correctamente", id: rows[0]?.id || result.insertId });
  } catch (error) {
    console.error(error);
    if (error.code === "23505") return res.status(400).json({ mensaje: "El nombre del área ya existe" });
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
      `SELECT u.id, dd.document_number AS cedula, u.first_name AS nombre, u.first_surname AS apellido,
              u.email AS correo, u.email, u.phone AS telefono,
              u.date_of_birth AS fecha_nacimiento, u.position_id AS cargo_id, u.area_id,
              u.schedule_id AS horario_id,
              NULLIF(regexp_replace(f.name, '\\D', '', 'g'), '')::int AS piso,
              u.hire_date AS fecha_ingreso, u.active AS activo, u.username, u.created_at,
              c.name AS cargo, r.name AS rol
       FROM users u
       LEFT JOIN positions c ON u.position_id = c.id
       LEFT JOIN areas a ON u.area_id = a.id
       LEFT JOIN floors f ON a.floor_id = f.id
       LEFT JOIN document_details dd ON dd.user_id = u.id
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
       WHERE u.area_id = ? ORDER BY u.first_name ASC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al obtener empleados del \u00e1rea" });
  }
};
