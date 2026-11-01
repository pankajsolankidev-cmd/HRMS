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

export type LeaveTypeType = (typeof LeaveType)[keyof typeof LeaveType];
export type LeaveDayTypeType = (typeof LeaveDayType)[keyof typeof LeaveDayType];
export type LeaveStatusType = (typeof LeaveStatus)[keyof typeof LeaveStatus];
