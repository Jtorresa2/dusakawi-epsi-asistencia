import type {
  AssignedUserRow,
  AssignmentHistoryRow,
  GlobalAssignmentHistoryRow,
  ScheduleAssignmentData,
  ScheduleAssignmentFilters,
  ScheduleData,
  ScheduleRow,
  ScheduleUpdateData,
  ScheduleUserRow,
} from '@modules/horarios/domain/entities/schedule';

export interface ScheduleRepository {
  getAllRows(): Promise<ScheduleRow[]>;
  getRowsById(id: string): Promise<ScheduleRow[]>;
  create(data: ScheduleData): Promise<string>;
  update(id: string, data: ScheduleUpdateData): Promise<void>;
  scheduleExists(id: string): Promise<boolean>;
  userExists(id: string): Promise<boolean>;
  getAssignmentCount(scheduleId: string): Promise<number>;
  deleteById(id: string): Promise<void>;
  assignUser(data: ScheduleAssignmentData): Promise<void>;
  getActiveUserIdsByIds(ids: string[]): Promise<string[]>;
  getActiveUserIdsByFilters(filters: ScheduleAssignmentFilters): Promise<string[]>;
  assignUsers(userIds: string[], data: ScheduleAssignmentData): Promise<void>;
  unassignUser(userId: string): Promise<void>;
  setDefault(scheduleId: string, isDefault: boolean): Promise<void>;
  getAssignedUsers(scheduleId: string): Promise<AssignedUserRow[]>;
  getScheduleUser(userId: string): Promise<ScheduleUserRow | null>;
  getMyScheduleRows(scheduleId: string): Promise<ScheduleRow[]>;
  getUserAssignmentHistory(userId: string): Promise<AssignmentHistoryRow[]>;
  getGlobalAssignmentHistory(): Promise<GlobalAssignmentHistoryRow[]>;
}
