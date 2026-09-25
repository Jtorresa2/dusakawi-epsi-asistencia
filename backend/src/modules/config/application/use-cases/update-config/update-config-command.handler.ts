import type { ConfigObject } from '@modules/config/domain/entities/config';
import type { ConfigRepository } from '@modules/config/domain/repositories/config-repository';
import type { UpdateConfigCommandDto } from './update-config-command.dto';

export interface UpdateConfigCommandResult {
  mensaje: string;
  config: ConfigObject;
}

export class UpdateConfigCommandHandler {
  constructor(private readonly configRepository: ConfigRepository) {}

  async handle(command: UpdateConfigCommandDto): Promise<UpdateConfigCommandResult> {
    const config = await this.configRepository.updateConfig(command.entries);
    return { mensaje: 'Configuración guardada', config };
  }
}