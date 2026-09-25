import { asClass, type AwilixContainer } from 'awilix';
import { GetSchedulesHandler } from '../application/use-cases/get-schedules/get-schedules.handler';
import { GetScheduleHandler } from '../application/use-cases/get-schedule/get-schedule.handler';
import { CreateScheduleHandler } from '../application/use-cases/create-schedule/create-schedule.handler';
import { UpdateScheduleHandler } from '../application/use-cases/update-schedule/update-schedule.handler';
import { DeleteScheduleHandler } from '../application/use-cases/delete-schedule/delete-schedule.handler';
import { AssignScheduleHandler } from '../application/use-cases/assign-schedule/assign-schedule.handler';
import { MassAssignScheduleHandler } from '../application/use-cases/mass-assign-schedule/mass-assign-schedule.handler';
import { UnassignScheduleHandler } from '../application/use-cases/unassign-schedule/unassign-schedule.handler';
import { SetDefaultScheduleHandler } from '../application/use-cases/set-default-schedule/set-default-schedule.handler';
import { GetAssignedUsersHandler } from '../application/use-cases/get-assigned-users/get-assigned-users.handler';
import { GetMyScheduleHandler } from '../application/use-cases/get-my-schedule/get-my-schedule.handler';
import { GetUserAssignmentHistoryHandler } from '../application/use-cases/get-user-assignment-history/get-user-assignment-history.handler';
import { GetGlobalAssignmentHistoryHandler } from '../application/use-cases/get-global-assignment-history/get-global-assignment-history.handler';
import { PrismaScheduleRepository } from './persistence/repositories/prisma/prisma-schedule-repository';

export function registerSchedulesModule(container: AwilixContainer) {
  container.register({
    scheduleRepository: asClass(PrismaScheduleRepository).singleton(),
    getSchedulesHandler: asClass(GetSchedulesHandler).scoped(),
    getScheduleHandler: asClass(GetScheduleHandler).scoped(),
    createScheduleHandler: asClass(CreateScheduleHandler).scoped(),
    updateScheduleHandler: asClass(UpdateScheduleHandler).scoped(),
    deleteScheduleHandler: asClass(DeleteScheduleHandler).scoped(),
    assignScheduleHandler: asClass(AssignScheduleHandler).scoped(),
    massAssignScheduleHandler: asClass(MassAssignScheduleHandler).scoped(),
    unassignScheduleHandler: asClass(UnassignScheduleHandler).scoped(),
    setDefaultScheduleHandler: asClass(SetDefaultScheduleHandler).scoped(),
    getAssignedUsersHandler: asClass(GetAssignedUsersHandler).scoped(),
    getMyScheduleHandler: asClass(GetMyScheduleHandler).scoped(),
    getUserAssignmentHistoryHandler: asClass(GetUserAssignmentHistoryHandler).scoped(),
    getGlobalAssignmentHistoryHandler: asClass(GetGlobalAssignmentHistoryHandler).scoped(),
  });
}
