const { Pool } = require("pg");
require("dotenv").config();


const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// ── Wrapper de compatibilidad mysql2 → pg ──────────────────────
// Convierte ? → $1, $2, ...
// Mantiene la misma firma que mysql2/promise: [rows, fields]
// Provee .insertId (vía RETURNING id) y .affectedRows

function convertPlaceholders(sql) {
  let idx = 0;
  return sql.replace(/\?(?=(?:[^']*'[^']*')*[^']*$)/g, () => `$${++idx}`);
}

const originalQuery = pool.query.bind(pool);

pool.query = (text, params) => {
  // Si no hay params o el texto no tiene ?, lo enviamos directo
  const sql = params ? convertPlaceholders(text) : text;

  return originalQuery(sql, params).then((result) => {
    // Emular [rows, fields] de mysql2/promise
    let insertId = 0;
    if (result.rows && result.rows.length > 0 && result.rows[0].id != null) {
      insertId = Number(result.rows[0].id);
    }

    const fakeResult = {
      insertId,
      affectedRows: result.rowCount ?? 0,
      rowCount: result.rowCount,
      rows: result.rows,
      fields: result.fields,
    };

    return [result.rows, fakeResult];
  });
};

pool.on("connect", () => {
  console.log("Conectado a PostgreSQL");
});

pool.on("error", (err) => {
  console.error("Error en PostgreSQL:", err);
});

module.exports = pool;
