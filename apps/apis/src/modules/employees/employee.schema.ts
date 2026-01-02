const errorResponse = {
  type: "object",
  properties: {
    error: { type: "string" },
  },
};

export const createEmployeeSchema = {
  tags: ["Employees"],

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
      systemId: { type: ["string", "null"] },
      userId: { type: ["string", "null"] },

      welcome: {
        type: "object",
        required: [
          "welcomewithWhatsapp",
          "welcomewithGmail",
          "welcomewithSlack",
        ],
        properties: {
          welcomewithWhatsapp: { type: "boolean" },
          welcomewithGmail: { type: "boolean" },
          welcomewithSlack: { type: "boolean" },
        },
        additionalProperties: false,
      },

      documents: {
        type: "object",
        required: ["generateOfferLetter", "generateAppointmentLetter"],
        properties: {
          generateOfferLetter: { type: "boolean" },
          generateAppointmentLetter: { type: "boolean" },
        },
        additionalProperties: false,
      },
    },
    additionalProperties: false,
  },

  response: {
    201: {
      type: "object",
      properties: {
        employeeId: { type: "string" },
        userId: { type: "string" },
      },
    },
    409: errorResponse,
    500: errorResponse,
  },
};

export const getEmployeesSchema = {
  tags: ["Employees"],
};

export const getEmployeeByIdSchema = {
  tags: ["Employees"],

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
      systemId: { type: ["string", "null"] },

      welcome: {
        type: "object",
        properties: {
          welcomewithWhatsapp: { type: "boolean" },
          welcomewithGmail: { type: "boolean" },
          welcomewithSlack: { type: "boolean" },
        },
        additionalProperties: false,
      },

      documents: {
        type: "object",
        properties: {
          generateOfferLetter: { type: "boolean" },
          generateAppointmentLetter: { type: "boolean" },
        },
        additionalProperties: false,
      },
    },
    additionalProperties: false,
  },

  response: {
    200: {
      type: "object",
      properties: {
        id: { type: "string" },
      },
    },
    404: errorResponse,
    500: errorResponse,
  },
};

export const deleteEmployeeSchema = {
  tags: ["Employees"],

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
