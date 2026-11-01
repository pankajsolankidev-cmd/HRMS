const messageResponse = {
  type: "object",
  required: ["message"],
  properties: {
    message: { type: "string" },
  },
};

const salaryIdParams = {
  type: "object",
  required: ["id"],
  properties: {
    id: { type: "string", format: "uuid" },
  },
};

const employeeIdParams = {
  type: "object",
  required: ["employeeId"],
  properties: {
    employeeId: { type: "string", format: "uuid" },
  },
};

export const createSalarySchema = {
  tags: ["Salary"],
  body: {
    type: "object",
    required: ["employeeId", "basicSalary"],
    properties: {
      employeeId: { type: "string", format: "uuid" },
      basicSalary: { type: "string" },
      tax: { type: "string", default: "0" },
      pf: { type: "string", default: "0" },
      description: { type: "string" },
      appraisalDate: { type: "string", format: "date" },
    },
    additionalProperties: false,
  },
  response: {
    201: messageResponse,
    409: messageResponse,
    500: messageResponse,
  },
};

export const getAllSalarySchema = {
  tags: ["Salary"],
  querystring: {
    type: "object",
    properties: {
      search: { type: "string" },
      employeeId: { type: "string", format: "uuid" },
      minSalary: { type: "number" },
      maxSalary: { type: "number" },

      page: { type: "number", minimum: 1 },
      limit: { type: "number", minimum: 1, maximum: 100 },

      sortBy: {
        type: "string",
        enum: ["createdAt", "basicSalary"],
      },
      sortOrder: {
        type: "string",
        enum: ["asc", "desc"],
      },
    },
    additionalProperties: false,
  },
};

export const getSalaryByIdSchema = {
  tags: ["Salary"],
  params: salaryIdParams,
  response: {
    404: messageResponse,
  },
};

export const getSalaryByEmployeeSchema = {
  tags: ["Salary"],
  params: employeeIdParams,
  response: {
    404: messageResponse,
  },
};

export const updateSalarySchema = {
  tags: ["Salary"],
  params: salaryIdParams,
  body: {
    type: "object",
    properties: {
      basicSalary: { type: "string" },
      tax: { type: "string" },
      pf: { type: "string" },
      description: { type: "string" },
      appraisalDate: { type: "string", format: "date" },
    },
    additionalProperties: false,
  },
  response: {
    200: messageResponse,
    404: messageResponse,
    500: messageResponse,
  },
};

export const deleteSalarySchema = {
  tags: ["Salary"],
  params: salaryIdParams,
  response: {
    200: messageResponse,
    404: messageResponse,
    500: messageResponse,
  },
};
