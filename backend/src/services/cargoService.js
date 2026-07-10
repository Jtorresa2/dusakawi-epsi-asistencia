const db = require("../config/db");

exports.obtenerTodos = async () => {
  const [rows] = await db.query(`
    SELECT *
    FROM cargos
    ORDER BY nombre ASC
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
  const { nombre, descripcion } = cargo;

  const [result] = await db.query(
    `
    INSERT INTO cargos
    (nombre, descripcion)
    VALUES (?, ?)
    `,
    [nombre, descripcion]
  );

  return result.insertId;
};

exports.actualizar = async (id, cargo) => {
  const { nombre, descripcion } = cargo;

  await db.query(
    `
    UPDATE cargos
    SET
      nombre = ?,
      descripcion = ?
    WHERE id = ?
    `,
    [nombre, descripcion, id]
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