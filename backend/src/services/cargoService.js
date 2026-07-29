const db = require("../config/db");

exports.obtenerTodos = async () => {
  const [rows] = await db.query(`
    SELECT c.*, a.nombre AS areas, COUNT(e.id)::int AS empleados_count
    FROM cargos c
    LEFT JOIN areas a ON a.id = c.area_id
    LEFT JOIN empleado e ON e.cargo_id = c.id
    GROUP BY c.id, c.nombre, c.descripcion, c.estado, c.creado_en, c.area_id, a.nombre
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
  const { nombre, descripcion, estado, area_id } = cargo;

  const [rows, result] = await db.query(
    `
    INSERT INTO cargos
    (nombre, descripcion, estado, area_id)
    VALUES (?, ?, ?, ?) RETURNING id
    `,
    [nombre, descripcion, estado || "activo", area_id || null]
  );

  return rows[0]?.id || result.insertId;
};

exports.actualizar = async (id, cargo) => {
  const { nombre, descripcion, estado, area_id } = cargo;

  await db.query(
    `
    UPDATE cargos
    SET
      nombre = ?,
      descripcion = ?,
      estado = ?,
      area_id = ?
    WHERE id = ?
    `,
    [nombre, descripcion, estado || "activo", area_id || null, id]
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