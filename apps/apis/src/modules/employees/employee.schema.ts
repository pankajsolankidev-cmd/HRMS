const errorResponse = {
  type: "object",
  properties: {
    error: { type: "string" },
  },
};

export const createEmployeeSchema = {
  tags: ["Employees"],
  security: [{ bearerAuth: [] }],

  body: {
    type: "object",
    required: [
      "firstName",
      "lastName",
      "email",
      "position",
      "joiningDate",
      "welcome",
      "documents",
    ],
    properties: {
      firstName: { type: "string" },
      lastName: { type: "string" },
      email: { type: "string", format: "email" },
      position: { type: "string" },

      departmentId: { type: "number" },
      joiningDate: { type: "string", format: "date" },

      managerId: { type: ["string", "null"] },

      systemId: { type: "string", nullable: true },

      welcome: {
        type: "object",
        required: ["whatsapp", "gmail", "slack"],
        properties: {
          whatsapp: { type: "boolean" },
          gmail: { type: "boolean" },
          slack: { type: "boolean" },
        },
      },

      documents: {
        type: "object",
        required: ["generateOfferLetter", "generateAppointmentLetter"],
        properties: {
          generateOfferLetter: { type: "boolean" },
          generateAppointmentLetter: { type: "boolean" },
        },
      },
    },
  },
  response: {
    201: {
      type: "object",
      properties: {
        message: { type: "string" },
        employeeId: { type: "string" },
      },
    },
    409: errorResponse,
    500: errorResponse,
  },
};

export const getEmployeesSchema = {
  tags: ["Employees"],
  security: [{ bearerAuth: [] }],
};

export const getEmployeeByIdSchema = {
  tags: ["Employees"],
  security: [{ bearerAuth: [] }],
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string" },
    },
  },
  response: {
    404: errorResponse,
  },
};

export const updateEmployeeSchema = {
  tags: ["Employees"],
  security: [{ bearerAuth: [] }],

  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string" },
    },
  },
  body: {
    type: "object",
    properties: {
      firstName: { type: "string" },
      lastName: { type: "string" },
      position: { type: "string" },
      departmentId: { type: "number" },
      managerId: { type: ["string", "null"] },
      systemId: { type: "string" },
    },
  },
  response: {
    404: errorResponse,
    500: errorResponse,
  },
};

export const deleteEmployeeSchema = {
  tags: ["Employees"],
  security: [{ bearerAuth: [] }],
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string" },
    },
  },
  response: {
    404: errorResponse,
    500: errorResponse,
  },
};
