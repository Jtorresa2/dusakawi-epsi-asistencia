import type { BackupResponse } from '@modules/config/domain/entities/config';
import type { ConfigRepository } from '@modules/config/domain/repositories/config-repository';

export class BackupDbCommandHandler {
  constructor(private readonly configRepository: ConfigRepository) {}

  async handle(): Promise<BackupResponse> {
    const tablas = await this.configRepository.getAllTableNames();
    const backup: Record<string, unknown[]> = {};

    for (const tabla of tablas) {
      backup[tabla] = await this.configRepository.getTableData(tabla);
    }

    const fecha = new Date().toISOString();
    await this.configRepository.saveBackupDate(fecha);

    return { ...backup, _respaldo: { fecha } };
  }
}