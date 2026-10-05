import { isValidUuid } from '@modules/horarios/application/services/id-validation';
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
    if (command.scheduleId && !isValidUuid(String(command.scheduleId))) {
      return { status: 'invalid-schedule-id' as const };
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

    // `getActiveUserIdsByIds` castea a uuid[]: si UN id viniera mal, Postgres
    // responde 22P02 y no se asigna nadie. Se filtran los invalidos antes.
    const requestedIds = Array.isArray(command.userIds)
      ? (command.userIds as unknown[]).map((id) => String(id))
      : null;
    const validIds = requestedIds
      ? requestedIds.filter((id) => isValidUuid(id))
      : null;
    const discardedIds = requestedIds && validIds ? requestedIds.length - validIds.length : 0;

    const userIds =
      validIds && validIds.length > 0
        ? await this.scheduleRepository.getActiveUserIdsByIds(validIds)
        : requestedIds && requestedIds.length > 0
          ? []
          : await this.scheduleRepository.getActiveUserIdsByFilters(command.filters);

    await this.scheduleRepository.assignUsers(userIds, {
      userId: '',
      scheduleId: command.scheduleId,
      validFrom,
      validUntil,
      reason: command.reason ?? null,
      assignedBy: command.assignedBy ?? null,
    });

    return { status: 'assigned' as const, count: userIds.length, discardedIds };
  }
}
