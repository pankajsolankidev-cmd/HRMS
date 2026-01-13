import { PayrollMonth } from "../../db/schema/payroll.enums";

const errorResponse = {
  type: "object",
  properties: {
    message: { type: "string" },
  },
  required: ["message"],
};

const payrollIdParams = {
  type: "object",
  required: ["id"],
  properties: {
    id: {
      type: "string",
      format: "uuid",
    },
  },
};

export const processPayrollSchema = {
  tags: ["Payroll"],
  body: {
    type: "object",
    required: ["employeeId", "month", "year"],
    properties: {
      employeeId: {
        type: "string",
        format: "uuid",
      },
      month: {
        type: "string",
        enum: PayrollMonth,
      },
      year: {
        type: "number",
      },
      totalDeductions: {
        type: "string",
      },
      file: {
        type: "string",
      },
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
    404: errorResponse,
    409: errorResponse,
    500: errorResponse,
  },
};

export const getPayrollsSchema = {
  tags: ["Payroll"],
  querystring: {
    type: "object",
    properties: {
      month: {
        type: "string",
        enum: PayrollMonth,
      },
      year: {
        type: "number",
      },
      employeeId: {
        type: "string",
        format: "uuid",
      },
      page: { type: "number", minimum: 1 },
      limit: { type: "number", minimum: 1, maximum: 100 },
      sortBy: {
        type: "string",
        enum: ["processedAt", "netSalary", "year"],
      },
      sortOrder: {
        type: "string",
        enum: ["asc", "desc"],
      },
    },
    additionalProperties: false,
  },
};

export const getPayrollByIdSchema = {
  tags: ["Payroll"],
  params: payrollIdParams,
  response: {
    404: errorResponse,
  },
};

export const payrollSummarySchema = {
  tags: ["Payroll"],
  querystring: {
    type: "object",
    required: ["month", "year"],
    properties: {
      month: {
        type: "string",
        enum: PayrollMonth,
      },
      year: {
        type: "number",
      },
    },
    additionalProperties: false,
  },
};

export const updatePayrollSchema = {
  tags: ["Payroll"],
  params: payrollIdParams,
  body: {
    type: "object",
    properties: {
      employeeId: {
        type: "string",
        format: "uuid",
      },
      month: {
        type: "string",
        enum: PayrollMonth,
      },
      year: {
        type: "number",
      },
      totalDeductions: {
        type: "string",
      },
      netSalary: {
        type: "string",
      },
      file: {
        type: "string",
      },
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

export const deletePayrollSchema = {
  tags: ["Payroll"],
  params: payrollIdParams,
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
