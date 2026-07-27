const pool = require("../config/db");

const EXCLUDED_TABLES = [];

async function getAllTableNames() {
  const [rows] = await pool.query(
    "SELECT TABLE_NAME, TABLE_TYPE FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'public' ORDER BY TABLE_NAME"
  );
  return rows
    .filter((r) => r.TABLE_TYPE === "BASE TABLE")
    .map((r) => r.TABLE_NAME)
    .filter((t) => !EXCLUDED_TABLES.includes(t));
}

async function getTableData(tableName) {
  const [rows] = await pool.query(`SELECT * FROM "${tableName}"`);
  return rows;
}

module.exports = { getAllTableNames, getTableData };
