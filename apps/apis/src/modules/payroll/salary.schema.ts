const salaryIdParams = {
  type: "object",
  required: ["id"],
  properties: {
    id: {
      type: "string",
      format: "uuid",
    },
  },
};

const employeeIdParams = {
  type: "object",
  required: ["employeeId"],
  properties: {
    employeeId: {
      type: "string",
      format: "uuid",
    },
  },
};

export const createSalarySchema: any = {
  tags: ["Salary"],
  body: {
    type: "object",
    required: ["employeeId", "basicSalary"],
    properties: {
      employeeId: {
        type: "string",
        format: "uuid",
      },
      basicSalary: {
        type: "string",
      },
      description: {
        type: "string",
      },
      appraisalDate: {
        type: "string",
        format: "date",
      },
    },
    additionalProperties: false,
  },
};

export const getAllSalarySchema: any = {
  tags: ["Salary"],
};

export const getSalaryByIdSchema: any = {
  tags: ["Salary"],
  params: salaryIdParams,
};

export const getSalaryByEmployeeSchema: any = {
  tags: ["Salary"],
  params: employeeIdParams,
};

export const updateSalarySchema: any = {
  tags: ["Salary"],
  params: salaryIdParams,
  body: {
    type: "object",
    properties: {
      basicSalary: {
        type: "string",
      },
      description: {
        type: "string",
      },
      appraisalDate: {
        type: "string",
        format: "date",
      },
    },
    additionalProperties: false,
  },
};

export const deleteSalarySchema: any = {
  tags: ["Salary"],
  params: salaryIdParams,
};
