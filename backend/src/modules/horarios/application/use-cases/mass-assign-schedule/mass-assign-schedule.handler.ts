import { getLocalDate } from '@modules/horarios/application/services/local-date';
import type {
  ScheduleAssignmentFilters,
  ScheduleSqlValue,
} from '@modules/horarios/domain/entities/schedule';
import type { ScheduleRepository } from '@modules/horarios/domain/repositories/schedule-repository';

export interface MassAssignScheduleCommand {
  scheduleId?: string;
  filters: ScheduleAssignmentFilters;
  validFrom?: string;
  validUntil?: string;
  reason?: ScheduleSqlValue;
  userIds?: unknown;
  assignedBy?: string;
}

export class MassAssignScheduleHandler {
  constructor(private readonly scheduleRepository: ScheduleRepository) {}

  async handle(command: MassAssignScheduleCommand) {
    if (!command.scheduleId) return { status: 'missing-schedule' as const };
    if (
      command.userIds !== undefined &&
      command.userIds !== null &&
      !Array.isArray(command.userIds)
    ) {
      return { status: 'invalid-user-ids' as const };
    }

    const validFrom = command.validFrom || getLocalDate();
    const validUntil = command.validUntil || null;
    if (validUntil && validUntil < getLocalDate()) {
      return { status: 'end-before-today' as const };
    }
    if (validUntil && validUntil < validFrom) {
      return { status: 'end-before-start' as const };
    }
    if (!(await this.scheduleRepository.scheduleExists(command.scheduleId))) {
      return { status: 'schedule-not-found' as const };
    }

    const userIds =
      Array.isArray(command.userIds) && command.userIds.length > 0
        ? await this.scheduleRepository.getActiveUserIdsByIds(command.userIds as string[])
        : await this.scheduleRepository.getActiveUserIdsByFilters(command.filters);

    await this.scheduleRepository.assignUsers(userIds, {
      userId: '',
      scheduleId: command.scheduleId,
      validFrom,
      validUntil,
      reason: command.reason ?? null,
      assignedBy: command.assignedBy ?? null,
    });

    return { status: 'assigned' as const, count: userIds.length };
  }
}
