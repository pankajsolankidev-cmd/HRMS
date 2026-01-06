
import { LeaveDayType, LeaveType } from "../../../../apps/apis/src/db/schema/leave.enums";

export type CreateLeaveRequestDto = {
  fromDate: string;
  toDate: string;
  type: typeof LeaveType[keyof typeof LeaveType];
  dayType: typeof LeaveDayType[keyof typeof LeaveDayType];
  reason?: string;
  file?: string;
};


export type UpdateLeaveRequestDto = {
  fromDate?: string;
  toDate?: string;
  type?: typeof LeaveType[keyof typeof LeaveType];
  dayType?: typeof LeaveDayType[keyof typeof LeaveDayType];
  reason?: string;
  file?: string;
};
