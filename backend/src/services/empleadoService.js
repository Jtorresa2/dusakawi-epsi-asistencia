const db = require("../config/db");

exports.obtenerTodos = async (filtros = {}) => {
  let sql = `
    SELECT e.*, a.nombre AS area, c.nombre AS cargo
    FROM empleado e
    LEFT JOIN areas a ON e.area_id = a.id
    LEFT JOIN cargos c ON e.cargo_id = c.id
    WHERE 1=1
  `;
  const params = [];

  if (filtros.area) {
    sql += " AND a.nombre = ?";
    params.push(filtros.area);
  }
  if (filtros.cargo) {
    sql += " AND c.nombre = ?";
    params.push(filtros.cargo);
  }

  sql += " ORDER BY e.nombre ASC";
  const [rows] = await db.query(sql, params);
  return rows;
};

exports.obtenerPorId = async (id) => {
  const [rows] = await db.query(
    `SELECT e.*, a.nombre AS area, c.nombre AS cargo
     FROM empleado e
     LEFT JOIN areas a ON e.area_id = a.id
     LEFT JOIN cargos c ON e.cargo_id = c.id
     WHERE e.id = ?`,
    [id]
  );
  return rows[0];
};

exports.crear = async (data) => {
  const { cedula, nombre, apellido, correo, telefono, fecha_nacimiento, cargo_id, area_id, horario_id, activo } = data;
  const [result] = await db.query(
    `INSERT INTO empleado (cedula, nombre, apellido, correo, telefono, fecha_nacimiento, cargo_id, area_id, horario_id, activo)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [cedula, nombre, apellido, correo, telefono, fecha_nacimiento, cargo_id || null, area_id || null, horario_id || null, activo !== undefined ? activo : 1]
  );
  return result.insertId;
};

exports.actualizar = async (id, data) => {
  const { cedula, nombre, apellido, correo, telefono, fecha_nacimiento, cargo_id, area_id, horario_id, activo } = data;
  await db.query(
    `UPDATE empleado SET cedula = ?, nombre = ?, apellido = ?, correo = ?, telefono = ?, fecha_nacimiento = ?, cargo_id = ?, area_id = ?, horario_id = ?, activo = ? WHERE id = ?`,
    [cedula, nombre, apellido, correo, telefono, fecha_nacimiento, cargo_id || null, area_id || null, horario_id || null, activo !== undefined ? activo : 1, id]
  );
};

exports.eliminar = async (id) => {
  await db.query("DELETE FROM empleado WHERE id = ?", [id]);
};
