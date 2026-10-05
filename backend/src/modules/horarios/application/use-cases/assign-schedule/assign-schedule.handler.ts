import { isValidUuid } from '@modules/horarios/application/services/id-validation';
import { getLocalDate } from '@modules/horarios/application/services/local-date';
import type { ScheduleSqlValue } from '@modules/horarios/domain/entities/schedule';
import type { ScheduleRepository } from '@modules/horarios/domain/repositories/schedule-repository';

export interface AssignScheduleCommand {
  userId?: string;
  scheduleId?: string;
  validFrom?: string;
  validUntil?: string;
  reason?: ScheduleSqlValue;
  assignedBy?: string;
}

export class AssignScheduleHandler {
  constructor(private readonly scheduleRepository: ScheduleRepository) {}

  async handle(command: AssignScheduleCommand) {
    if (!command.userId || !command.scheduleId) return { status: 'missing-fields' as const };

    // users.id y schedules.id son uuid. Sin este guard, un id no-uuid llega a
    // Postgres y responde 22P02 como error crudo del servidor.
    if (!isValidUuid(String(command.userId))) return { status: 'invalid-user-id' as const };
    if (!isValidUuid(String(command.scheduleId))) return { status: 'invalid-schedule-id' as const };

    const validFrom = command.validFrom || getLocalDate();
    const validUntil = command.validUntil || null;
    if (validUntil && validUntil < getLocalDate()) {
      return { status: 'end-before-today' as const };
    }
    if (validUntil && validUntil < validFrom) {
      return { status: 'end-before-start' as const };
    }
    if (!(await this.scheduleRepository.userExists(command.userId))) {
      return { status: 'user-not-found' as const };
    }
    if (!(await this.scheduleRepository.scheduleExists(command.scheduleId))) {
      return { status: 'schedule-not-found' as const };
    }

    await this.scheduleRepository.assignUser({
      userId: command.userId,
      scheduleId: command.scheduleId,
      validFrom,
      validUntil,
      reason: command.reason ?? null,
      assignedBy: command.assignedBy ?? null,
    });
    return { status: 'assigned' as const };
  }
}
