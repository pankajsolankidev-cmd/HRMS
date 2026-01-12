import {
  LeaveType,
  LeaveDayType,
  LeaveStatus,
} from "../../db/schema/leave.enums";

const leaveRequestIdParams = {
  type: "object",
  required: ["id"],
  properties: {
    id: { type: "string", format: "uuid" },
  },
};

export const createLeaveRequestSchema = {
  tags: ["Leave Requests"],
  body: {
    type: "object",
    required: ["fromDate", "toDate", "type", "dayType"],
    properties: {
      fromDate: { type: "string", format: "date" },
      toDate: { type: "string", format: "date" },
      type: { type: "string", enum: Object.values(LeaveType) },
      dayType: { type: "string", enum: Object.values(LeaveDayType) },
      reason: { type: "string" },
      file: { type: "string" },
    },
    additionalProperties: false,
  },
};

export const getMyLeaveRequestsSchema = {
  tags: ["Leave Requests"],
  querystring: {
    type: "object",
    properties: {
      search: { type: "string" },
      status: { type: "string", enum: Object.values(LeaveStatus) },
      type: { type: "string", enum: Object.values(LeaveType) },
      page: { type: "number", minimum: 1 },
      limit: { type: "number", minimum: 1, maximum: 50 },
      sortBy: { type: "string", enum: ["createdAt", "fromDate"] },
      sortOrder: { type: "string", enum: ["asc", "desc"] },
    },
    additionalProperties: false,
  },
};

export const updateLeaveRequestSchema = {
  tags: ["Leave Requests"],
  params: leaveRequestIdParams,
  body: {
    type: "object",
    properties: {
      fromDate: { type: "string", format: "date" },
      toDate: { type: "string", format: "date" },
      type: { type: "string", enum: Object.values(LeaveType) },
      dayType: { type: "string", enum: Object.values(LeaveDayType) },
      reason: { type: "string" },
      file: { type: "string" },
    },
    additionalProperties: false,
  },
};

export const getLeaveRequestByIdSchema = {
  tags: ["Leave Requests"],
  params: leaveRequestIdParams,
};

export const deleteLeaveRequestSchema = {
  tags: ["Leave Requests"],
  params: leaveRequestIdParams,
};
