import {
  LeaveType,
  LeaveDayType,
} from "../../db/schema/leave.enums";

export const createLeaveRequestSchema = {
  tags: ["Leave Requests"],
  body: {
    type: "object",
    required: ["fromDate", "toDate", "type", "dayType"],
    properties: {
      fromDate: { type: "string", format: "date" },
      toDate: { type: "string", format: "date" },

      type: {
        type: "string",
        enum: Object.values(LeaveType),
      },

      dayType: {
        type: "string",
        enum: Object.values(LeaveDayType),
      },

      reason: { type: "string" },
      file: { type: "string" },
    },
  },
};
