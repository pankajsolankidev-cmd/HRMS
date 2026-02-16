export type LeaveType = "sick" | "casual" | "marriage" | "wfh";

export type LeaveDayType =
  | "full_day"
  | "first_half"
  | "second_half"
  | "multiple_days";

export type LeaveStatus = "pending" | "approved" | "rejected";

export type Employee = {
  id: string;
  firstName: string;
  lastName: string;
  userId: string;
};
export type CreateBy = {
  id: string;
  firstName: string;
  lastName: string;
  userId: string;
};
export type ActionUser = {
  id: string;
  firstName: string;
  lastName: string;
};

export type LeaveBase = {
  id: string;
  fromDate: string;
  toDate: string;
  type: LeaveType;
  dayType: LeaveDayType;
  status: LeaveStatus;
  reason: string;
  rejectionReason?: string | null;
  file?: string;
};

export type LeaveList = LeaveBase & {
  totalDays: string;
};

export type LeaveApiResponse<TLeave = LeaveBase> = {
  employee: Employee;
  leave: TLeave;
  approvedByUser?: ActionUser | null;
  rejectedByUser?: ActionUser | null;
  createdByEmployee?: CreateBy;
};

export interface LeaveRow {
  id: string;
  employee: Employee;
  fromDate: string;
  toDate: string;
  type: LeaveType;
  dayType: LeaveDayType;
  status: LeaveStatus;
  reason: string;
  totalDays: string;
  rejectionReason?: string | null;
  file?: string;

  approvedByUser?: ActionUser | null;
  rejectedByUser?: ActionUser | null;
  createdByEmployee?: CreateBy;
}
