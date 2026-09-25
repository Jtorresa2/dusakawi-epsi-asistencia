export type ScheduleSqlValue = string | number | boolean | null;

export interface ScheduleDetailData {
  dayOfWeek: ScheduleSqlValue;
  morningEntry: ScheduleSqlValue;
  morningExit: ScheduleSqlValue;
  afternoonEntry: ScheduleSqlValue;
  afternoonExit: ScheduleSqlValue;
}

export interface ScheduleRow {
  id: string;
  name: string;
  toleranceMinutes: number;
  toleranceDepartureMinutes: number;
  description: string | null;
  modality: string;
  workdayType: string;
  expectedHours: string | null;
  active: boolean;
  isDefault: boolean;
  createdAt: Date;
  detailId: string | null;
  dayOfWeek: string | null;
  morningEntry: string | null;
  morningExit: string | null;
  afternoonEntry: string | null;
  afternoonExit: string | null;
}

export interface ScheduleUserRow {
  id: string;
  scheduleId: string | null;
  firstName: string;
  lastName: string;
}

export interface AssignedUserRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface AssignmentHistoryRow {
  id: string;
  userId: string;
  scheduleId: string;
  validFrom: Date;
  validUntil: Date | null;
  reason: string | null;
  assignedBy: string | null;
  createdAt: Date;
  scheduleName: string;
}

export interface GlobalAssignmentHistoryRow {
  employee: string;
  newSchedule: string;
  previousSchedule: string | null;
  date: Date;
  user: string | null;
  reason: string | null;
}

export interface ScheduleData {
  name: ScheduleSqlValue;
  modality: ScheduleSqlValue;
  workdayType: ScheduleSqlValue;
  description: ScheduleSqlValue;
  expectedHours: ScheduleSqlValue;
  toleranceMinutes: ScheduleSqlValue;
  toleranceDepartureMinutes: ScheduleSqlValue;
  active: ScheduleSqlValue;
  details: ScheduleDetailData[];
}

export interface ScheduleUpdateData {
  name: ScheduleSqlValue;
  toleranceMinutes: ScheduleSqlValue;
  description: ScheduleSqlValue;
  modality: ScheduleSqlValue;
  workdayType: ScheduleSqlValue;
  details: unknown;
}

export interface ScheduleAssignmentData {
  userId: string;
  scheduleId: string;
  validFrom: string;
  validUntil: string | null;
  reason: ScheduleSqlValue;
  assignedBy: string | null;
}

export interface ScheduleAssignmentFilters {
  areaId?: ScheduleSqlValue;
  positionId?: ScheduleSqlValue;
}
