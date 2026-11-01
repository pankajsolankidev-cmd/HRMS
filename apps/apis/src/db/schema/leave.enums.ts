import { pgEnum } from "drizzle-orm/pg-core";
import { LeaveDayType, LeaveStatus, LeaveType } from "@shared/types";

export { LeaveDayType, LeaveStatus, LeaveType };

export const leaveTypeEnum = pgEnum(
  "leave_type",
  Object.values(LeaveType) as [string, ...string[]],
);

export const leaveDayTypeEnum = pgEnum(
  "leave_day_type",
  Object.values(LeaveDayType) as [string, ...string[]],
);

export const leaveStatusEnum = pgEnum(
  "leave_status",
  Object.values(LeaveStatus) as [string, ...string[]],
);
