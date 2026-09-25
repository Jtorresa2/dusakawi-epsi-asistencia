import { prisma } from '@config/database/prisma/prisma';
import type { ConfigObject, ConfigValue } from '@modules/config/domain/entities/config';
import type { ConfigRepository } from '@modules/config/domain/repositories/config-repository';

export class PrismaConfigRepository implements ConfigRepository {
  async getConfig(): Promise<ConfigObject> {
    const rows = await prisma.$queryRaw<{ clave: string; valor: string; tipo: string }[]>`
      SELECT key AS clave, value AS valor, type AS tipo FROM asistencia.config ORDER BY key
    `;

    const config: ConfigObject = {};
    for (const row of rows) {
      if (row.tipo === 'number') config[row.clave] = Number(row.valor);
      else if (row.tipo === 'boolean') config[row.clave] = row.valor === 'true';
      else config[row.clave] = row.valor;
    }
    return config;
  }

  async updateConfig(entries: Record<string, ConfigValue>): Promise<ConfigObject> {
    for (const [clave, valor] of Object.entries(entries)) {
      const tipo = typeof valor === 'number' ? 'number' : typeof valor === 'boolean' ? 'boolean' : 'text';
      await prisma.$executeRaw`
        INSERT INTO asistencia.config (key, value, type) VALUES (${clave}, ${String(valor)}, ${tipo})
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, type = EXCLUDED.type
      `;
    }

    return this.getConfig();
  }

  async getAllTableNames(): Promise<string[]> {
    const rows = await prisma.$queryRaw<{ TABLE_NAME: string; TABLE_TYPE: string }[]>`
      SELECT TABLE_NAME, TABLE_TYPE FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'public' ORDER BY TABLE_NAME
    `;
    return rows
      .filter((r) => r.TABLE_TYPE === 'BASE TABLE')
      .map((r) => r.TABLE_NAME);
  }

  async getTableData(tableName: string): Promise<unknown[]> {
    return prisma.$queryRawUnsafe(`SELECT * FROM "${tableName}"`);
  }

  async saveBackupDate(fecha: string): Promise<void> {
    await prisma.$executeRaw`
      INSERT INTO asistencia.config (key, value, type) VALUES ('fecha_ultimo_respaldo', ${fecha}, 'text')
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
    `;
  }
}