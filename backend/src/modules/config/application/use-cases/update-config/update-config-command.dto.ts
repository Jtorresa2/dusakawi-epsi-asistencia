import type { ConfigValue } from '@modules/config/domain/entities/config';

export interface UpdateConfigCommandDto {
  entries: Record<string, ConfigValue>;
}