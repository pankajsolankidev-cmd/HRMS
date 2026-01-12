import {
  LeaveType,
  LeaveDayType,
  LeaveStatus,
} from "../../db/schema/leave.enums";

const errorResponse = {
  type: "object",
  properties: {
    message: { type: "string" },
  },
  required: ["message"],
};

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
  response: {
    201: {
      type: "object",
      properties: {
        message: { type: "string" },
      },
      required: ["message"],
    },
    400: errorResponse,
    500: errorResponse,
  },
};

export const getMyLeaveRequestsSchema = {
  tags: ["Leave Requests"],
  querystring: {
    type: "object",
    properties: {
      search: { type: "string" },
      status: {
        type: "string",
        enum: Object.values(LeaveStatus),
      },
      type: {
        type: "string",
        enum: Object.values(LeaveType),
      },
      page: { type: "number", minimum: 1 },
      limit: { type: "number", minimum: 1, maximum: 50 },
      sortBy: {
        type: "string",
        enum: ["createdAt", "fromDate"],
      },
      sortOrder: {
        type: "string",
        enum: ["asc", "desc"],
      },
    },
    additionalProperties: false,
  },
};

export const getLeaveRequestByIdSchema = {
  tags: ["Leave Requests"],
  params: leaveRequestIdParams,
  response: {
    404: errorResponse,
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
  response: {
    200: {
      type: "object",
      properties: {
        message: { type: "string" },
      },
      required: ["message"],
    },
    404: errorResponse,
    500: errorResponse,
  },
};

export const deleteLeaveRequestSchema = {
  tags: ["Leave Requests"],
  params: leaveRequestIdParams,
  response: {
    200: {
      type: "object",
      properties: {
        message: { type: "string" },
      },
      required: ["message"],
    },
    404: errorResponse,
    500: errorResponse,
  },
};
