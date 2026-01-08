const salaryStructureIdParams = {
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

export const createSalaryStructureSchema: any = {
  tags: ["Salary Structures"],
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

export const getAllSalaryStructuresSchema: any = {
  tags: ["Salary Structures"],
};

export const getSalaryStructureByIdSchema: any = {
  tags: ["Salary Structures"],
  params: salaryStructureIdParams,
};

export const getSalaryStructureByEmployeeSchema: any = {
  tags: ["Salary Structures"],
  params: employeeIdParams,
};

export const updateSalaryStructureSchema: any = {
  tags: ["Salary Structures"],
  params: salaryStructureIdParams,
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

export const deleteSalaryStructureSchema: any = {
  tags: ["Salary Structures"],
  params: salaryStructureIdParams,
};
