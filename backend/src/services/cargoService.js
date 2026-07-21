const db = require("../config/db");

exports.obtenerTodos = async () => {
  const [rows] = await db.query(`
    SELECT c.*, COUNT(e.id) AS empleados_count
    FROM cargos c
    LEFT JOIN empleado e ON e.cargo_id = c.id
    GROUP BY c.id
    ORDER BY c.nombre ASC
  `);

  return rows;
};

exports.obtenerPorId = async (id) => {
  const [rows] = await db.query(
    `
    SELECT *
    FROM cargos
    WHERE id = ?
    `,
    [id]
  );

  return rows[0];
};

exports.crear = async (cargo) => {
  const { nombre, descripcion, estado } = cargo;

  const [result] = await db.query(
    `
    INSERT INTO cargos
    (nombre, descripcion, estado)
    VALUES (?, ?, ?)
    `,
    [nombre, descripcion, estado || "activo"]
  );

  return result.insertId;
};

exports.actualizar = async (id, cargo) => {
  const { nombre, descripcion, estado } = cargo;

  await db.query(
    `
    UPDATE cargos
    SET
      nombre = ?,
      descripcion = ?,
      estado = ?
    WHERE id = ?
    `,
    [nombre, descripcion, estado || "activo", id]
  );
};

exports.eliminar = async (id) => {
  await db.query(
    `
    DELETE FROM cargos
    WHERE id = ?
    `,
    [id]
  );
};