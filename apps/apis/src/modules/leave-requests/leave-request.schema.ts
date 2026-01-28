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

const employeeObjectSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    firstName: { type: "string" },
    lastName: { type: "string" },
  },
  required: ["id", "firstName", "lastName"],
};

const leaveObjectSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    fromDate: { type: "string", format: "date" },
    toDate: { type: "string", format: "date" },

    type: { type: "string", enum: Object.values(LeaveType) },
    dayType: { type: "string", enum: Object.values(LeaveDayType) },

    fromHour: { type: "number" },
    toHour: { type: "number" },

    totalHours: { type: "number" },
    totalDays: { type: "string" },

    status: { type: "string", enum: Object.values(LeaveStatus) },

    reason: { type: "string" },
    file: { type: "string" },

    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
};

export const createLeaveRequestSchema = {
  tags: ["Leave Requests"],
  body: {
    type: "object",
    required: ["fromDate", "toDate", "type", "dayType", "fromHour", "toHour"],
    properties: {
      fromDate: { type: "string", format: "date" },
      toDate: { type: "string", format: "date" },

      type: { type: "string", enum: Object.values(LeaveType) },
      dayType: { type: "string", enum: Object.values(LeaveDayType) },

      fromHour: { type: "number", minimum: 0, maximum: 24 },
      toHour: { type: "number", minimum: 0, maximum: 24 },

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

export const getAllLeaveRequestsSchema = {
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
  response: {
    200: {
      type: "object",
      properties: {
        data: {
          type: "array",
          items: {
            type: "object",
            properties: {
              leave: leaveObjectSchema,
              employee: employeeObjectSchema,
            },
            required: ["leave", "employee"],
          },
        },
        meta: {
          type: "object",
          properties: {
            page: { type: "number" },
            limit: { type: "number" },
            total: { type: "number" },
          },
          required: ["page", "limit", "total"],
        },
      },
      required: ["data", "meta"],
    },
  },
};

export const getLeaveRequestByIdSchema = {
  tags: ["Leave Requests"],
  params: leaveRequestIdParams,
  response: {
    200: {
      type: "object",
      properties: {
        data: {
          type: "object",
          properties: {
            leave: leaveObjectSchema,
            employee: employeeObjectSchema,
          },
          required: ["leave", "employee"],
        },
      },
      required: ["data"],
    },
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

      fromHour: { type: "number", minimum: 0, maximum: 24 },
      toHour: { type: "number", minimum: 0, maximum: 24 },

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
