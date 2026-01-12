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
      description: { type: "string" },
      appraisalDate: { type: "string", format: "date" },
    },
    additionalProperties: false,
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
};

export const getSalaryByEmployeeSchema = {
  tags: ["Salary"],
  params: employeeIdParams,
};

export const updateSalarySchema = {
  tags: ["Salary"],
  params: salaryIdParams,
  body: {
    type: "object",
    properties: {
      basicSalary: { type: "string" },
      description: { type: "string" },
      appraisalDate: { type: "string", format: "date" },
    },
    additionalProperties: false,
  },
};

export const deleteSalarySchema = {
  tags: ["Salary"],
  params: salaryIdParams,
};
