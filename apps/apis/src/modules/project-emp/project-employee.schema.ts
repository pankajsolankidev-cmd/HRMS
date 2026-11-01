export const assignProjectEmployeesSchema = {
  tags: ["Projects"],
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string" },
    },
  },
  body: {
    type: "object",
    required: ["employeeIds"],
    properties: {
      employeeIds: {
        type: "array",
        items: { type: "string" },
        minItems: 1,
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
  },
};

export const getProjectEmployeesSchema = {
  tags: ["Projects"],
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string" },
    },
  },
};

export const removeProjectEmployeeSchema = {
  tags: ["Projects"],
  params: {
    type: "object",
    required: ["id", "employeeId"],
    properties: {
      id: { type: "string" },
      employeeId: { type: "string" },
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        message: { type: "string" },
      },
      required: ["message"],
    },
    404: {
      type: "object",
      properties: {
        message: { type: "string" },
      },
      required: ["message"],
    },
  },
};
