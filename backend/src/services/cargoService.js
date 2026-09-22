const db = require("../config/db");

exports.obtenerTodos = async () => {
  const [rows] = await db.query(`
    SELECT
      p.id,
      p.name AS nombre,
      p.name,
      p.description AS descripcion,
      p.description,
      'activo' AS estado,
      COUNT(u.id)::int AS empleados_count
    FROM positions p
    LEFT JOIN users u ON u.position_id = p.id
    GROUP BY p.id, p.name, p.description
    ORDER BY p.name ASC
  `);

  return rows;
};

exports.obtenerPorId = async (id) => {
  const [rows] = await db.query(
    `
    SELECT
      p.id,
      p.name AS nombre,
      p.name,
      p.description AS descripcion,
      p.description,
      'activo' AS estado
    FROM positions p
    WHERE p.id = ?
    `,
    [id]
  );

  return rows[0];
};

exports.crear = async (cargo) => {
  const { nombre, name, descripcion, description } = cargo;
  const cargoNombre = nombre || name;
  const cargoDesc = descripcion || description || '';

  const [rows, result] = await db.query(
    `
    INSERT INTO positions (name, description)
    VALUES (?, ?) RETURNING id
    `,
    [cargoNombre, cargoDesc]
  );

  return rows[0]?.id || result.insertId;
};

exports.actualizar = async (id, cargo) => {
  const { nombre, name, descripcion, description } = cargo;
  const cargoNombre = nombre || name;
  const cargoDesc = descripcion || description;

  await db.query(
    `
    UPDATE positions
    SET
      name = COALESCE(?, name),
      description = COALESCE(?, description)
    WHERE id = ?
    `,
    [cargoNombre, cargoDesc, id]
  );
};

exports.eliminar = async (id) => {
  await db.query(
    `
    DELETE FROM positions
    WHERE id = ?
    `,
    [id]
  );
};