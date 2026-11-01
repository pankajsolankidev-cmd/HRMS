import { LeaveDayType, LeaveType } from "./leave.enums";

export type CreateLeaveRequestDto = {
  fromDate: string;
  toDate: string;
  type: (typeof LeaveType)[keyof typeof LeaveType];
  dayType: (typeof LeaveDayType)[keyof typeof LeaveDayType];
  fromHour: number;
  toHour: number;
  reason?: string;
  file?: string;
  approvedBy?: string | null;
  approvedAt?: string | null;
  rejectedBy?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
};

export type UpdateLeaveRequestDto = {
  fromDate?: string;
  toDate?: string;
  type?: (typeof LeaveType)[keyof typeof LeaveType];
  dayType?: (typeof LeaveDayType)[keyof typeof LeaveDayType];
  fromHour?: number;
  toHour?: number;
  reason?: string;
  file?: string;
};

export interface CreateManualLeaveRequestDto {
  employeeId: string;
  fromDate: string;
  toDate: string;
  type: string;
  dayType: string;
  fromHour: number;
  toHour: number;
  reason?: string;
  file?: string;
}
