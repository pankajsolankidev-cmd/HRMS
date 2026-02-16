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
      employeeId: { type: "string", format: "uuid" },
      month: { type: "string", enum: PayrollMonth },
      year: { type: "number" },
      deductions: { type: "number", minimum: 0 },
      deductionReason: { type: "string" },
      bonus: { type: "number", minimum: 0 },
      bonusDescription: { type: "string" },
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

export const employeeBulkPayrollSchema = {
  tags: ["Payroll"],
  querystring: {
    type: "object",
    properties: {
      month: { type: "string", enum: PayrollMonth },
      year: { type: "number" },
    },
    additionalProperties: false,
  },
};

export const processBulkPayrollSchema = {
  tags: ["Payroll"],
  body: {
    type: "object",
    required: ["adjustments"],
    properties: {
      month: { type: "string", enum: PayrollMonth },
      year: { type: "number" },
      adjustments: {
        type: "array",
        minItems: 1,
        items: {
          type: "object",
          required: ["employeeId"],
          properties: {
            employeeId: { type: "string", format: "uuid" },
            deductions: { type: "number", minimum: 0 },
            deductionReason: { type: "string" },
            bonus: { type: "number", minimum: 0 },
            bonusDescription: { type: "string" },
          },
          additionalProperties: false,
        },
      },
    },
    additionalProperties: false,
  },
  response: {
    201: {
      type: "object",
      required: ["message"],
      properties: {
        message: { type: "string" },
      },
    },

    409: {
      type: "object",
      required: ["message", "employees"],
      properties: {
        message: { type: "string" },
        employees: {
          type: "array",
          items: { type: "string" },
        },
      },
    },

    422: {
      type: "object",
      required: ["message", "employees"],
      properties: {
        message: { type: "string" },
        employees: {
          type: "array",
          items: { type: "string" },
        },
      },
    },

    400: errorResponse,
    500: errorResponse,
  },
};
