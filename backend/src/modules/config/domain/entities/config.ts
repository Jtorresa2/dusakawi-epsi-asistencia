export type ConfigValue = string | number | boolean;

export type ConfigObject = Record<string, ConfigValue>;

export interface BackupResponse {
  [tableName: string]: unknown[] | { fecha: string };
  _respaldo: { fecha: string };
}