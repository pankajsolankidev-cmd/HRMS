import { PayrollMonth } from "../../db/schema/payroll.enums";

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
    },
    additionalProperties: false,
  },
};

export const getPayrollByIdSchema = {
  tags: ["Payroll"],
  params: payrollIdParams,
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
};

export const deletePayrollSchema = {
  tags: ["Payroll"],
  params: payrollIdParams,
};
