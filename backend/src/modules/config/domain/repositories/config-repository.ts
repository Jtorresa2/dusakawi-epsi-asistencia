import type { ConfigObject, ConfigValue } from '@modules/config/domain/entities/config';

export interface ConfigRepository {
  getConfig(): Promise<ConfigObject>;
  updateConfig(entries: Record<string, ConfigValue>): Promise<ConfigObject>;
  getAllTableNames(): Promise<string[]>;
  getTableData(tableName: string): Promise<unknown[]>;
  saveBackupDate(fecha: string): Promise<void>;
}