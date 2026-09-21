import pool from '../../../config/db';

const EXCLUDED_TABLES: string[] = [];

export async function getAllTableNames(): Promise<string[]> {
  const { rows } = await pool.query(
    "SELECT TABLE_NAME, TABLE_TYPE FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'asistencia' ORDER BY TABLE_NAME"
  );
  return rows
    .filter((r: { TABLE_TYPE: string }) => r.TABLE_TYPE === 'BASE TABLE')
    .map((r: { TABLE_NAME: string }) => r.TABLE_NAME)
    .filter((t: string) => !EXCLUDED_TABLES.includes(t));
}

export async function getTableData(tableName: string): Promise<Record<string, unknown>[]> {
  const { rows } = await pool.query(`SELECT * FROM "${tableName}"`);
  return rows;
}
