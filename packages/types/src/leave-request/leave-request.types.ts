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

export interface LeaveRequestEntity {
  id: string;
  fromDate: string;
  toDate: string;
  type: (typeof LeaveType)[keyof typeof LeaveType] | string;
  dayType: (typeof LeaveDayType)[keyof typeof LeaveDayType] | string;
  status: "pending" | "approved" | "rejected";
  reason: string;
  totalDays?: string | number;
  fromHour?: number;
  toHour?: number;
  rejectionReason?: string | null;
  file?: string;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    userId?: string;
  };
  createdByEmployee?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  approvedByUser?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  rejectedByUser?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  createdAt?: string;
  updatedAt?: string;
}
