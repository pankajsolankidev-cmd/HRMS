import { pgEnum } from "drizzle-orm/pg-core";

export const LeaveType = {
  Sick: "sick",
  Casual: "casual",
  Marriage: "marriage",
  Wfh: "wfh",
} as const;

export const LeaveDayType = {
  FullDay: "full_day",
  FirstHalf: "first_half",
  SecondHalf: "second_half",
  MultipleDays: "multiple_days",
} as const;

export const LeaveStatus = {
  Pending: "pending",
  Approved: "approved",
  Rejected: "rejected",
} as const;

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
