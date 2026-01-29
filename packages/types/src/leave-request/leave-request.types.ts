import {
  LeaveDayType,
  LeaveType,
} from "../../../../apps/apis/src/db/schema/leave.enums";

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
