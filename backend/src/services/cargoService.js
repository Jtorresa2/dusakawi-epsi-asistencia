const db = require("../config/db");

exports.obtenerTodos = async () => {
  const { rows } = await db.query(`
    SELECT c.*, a.nombre AS areas, COUNT(u.id)::int AS empleados_count
    FROM cargos c
    LEFT JOIN areas a ON a.id = c.area_id
    LEFT JOIN usuarios u ON u.cargo_id = c.id
    GROUP BY c.id, c.nombre, c.descripcion, c.estado, c.creado_en, c.area_id, a.nombre
    ORDER BY c.nombre ASC
  `);

  return rows;
};

exports.obtenerPorId = async (id) => {
  const { rows } = await db.query(
    `
    SELECT *
    FROM cargos
    WHERE id = $1
    `,
    [id]
  );

  return rows[0];
};

exports.crear = async (cargo) => {
  const { nombre, descripcion, estado, area_id } = cargo;

  const { rows: [nuevo] } = await db.query(
    `
    INSERT INTO cargos
    (nombre, descripcion, estado, area_id)
    VALUES ($1, $2, $3, $4) RETURNING id
    `,
    [nombre, descripcion, estado || "activo", area_id || null]
  );

  return nuevo?.id ?? 0;
};

exports.actualizar = async (id, cargo) => {
  const { nombre, descripcion, estado, area_id } = cargo;

  await db.query(
    `
    UPDATE cargos
    SET
      nombre = $1,
      descripcion = $2,
      estado = $3,
      area_id = $4
    WHERE id = $5
    `,
    [nombre, descripcion, estado || "activo", area_id || null, id]
  );
};

exports.eliminar = async (id) => {
  await db.query(
    `
    DELETE FROM cargos
    WHERE id = $1
    `,
    [id]
  );
};