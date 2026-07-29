const pool = require("../config/db");

exports.obtenerTodos = async (activo = null) => {
  let sql = "SELECT * FROM festivos WHERE 1=1";
  const params = [];
  if (activo !== null) { sql += " AND activo = ?"; params.push(activo); }
  sql += " ORDER BY fecha DESC";
  const [rows] = await pool.query(sql, params);
  return rows;
};

exports.obtenerPorId = async (id) => {
  const [rows] = await pool.query("SELECT * FROM festivos WHERE id = ?", [id]);
  return rows[0] || null;
};

exports.crear = async ({ fecha, nombre, tipo }) => {
  const tipoValido = tipo || "nacional";
  if (!["nacional", "regional", "institucional"].includes(tipoValido)) {
    throw new Error("tipo debe ser: nacional, regional o institucional");
  }
  const [result] = await pool.query(
    `INSERT INTO festivos (fecha, nombre, tipo) VALUES (?, ?, ?) RETURNING id`,
    [fecha, nombre, tipoValido]
  );
  return { id: result[0]?.id || result.insertId, fecha, nombre, tipo: tipoValido };
};

exports.actualizar = async (id, { fecha, nombre, tipo, activo }) => {
  const campos = [];
  const params = [];
  if (fecha !== undefined) { campos.push("fecha = ?"); params.push(fecha); }
  if (nombre !== undefined) { campos.push("nombre = ?"); params.push(nombre); }
  if (tipo !== undefined) { campos.push("tipo = ?"); params.push(tipo); }
  if (activo !== undefined) { campos.push("activo = ?"); params.push(activo); }
  if (campos.length === 0) return { id };
  params.push(id);
  await pool.query(`UPDATE festivos SET ${campos.join(", ")} WHERE id = ?`, params);
  return { id };
};

exports.eliminar = async (id) => {
  await pool.query("DELETE FROM festivos WHERE id = ?", [id]);
  return { id };
};

exports.verificarFestivo = async (fecha) => {
  const [rows] = await pool.query(
    "SELECT id, nombre, tipo FROM festivos WHERE fecha = ? AND activo = TRUE",
    [fecha]
  );
  return rows[0] || null;
};
