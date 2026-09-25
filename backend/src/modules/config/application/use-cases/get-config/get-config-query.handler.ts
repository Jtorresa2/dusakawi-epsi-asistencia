import type { ConfigObject } from '@modules/config/domain/entities/config';
import type { ConfigRepository } from '@modules/config/domain/repositories/config-repository';

export class GetConfigQueryHandler {
  constructor(private readonly configRepository: ConfigRepository) {}

  async handle(): Promise<ConfigObject> {
    return this.configRepository.getConfig();
  }
}