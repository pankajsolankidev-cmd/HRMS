const errorResponse = {
  type: "object",
  properties: {
    message: { type: "string" },
  },
  required: ["message"],
};

export const createEmployeeSchema = {
  tags: ["Employees"],

  body: {
    type: "object",
    required: [
      "firstName",
      "lastName",
      "email",
      "positionId",
      "joiningDate",
      "welcome",
      "documents",
    ],
    properties: {
      firstName: { type: "string" },
      lastName: { type: "string" },
      email: { type: "string", format: "email" },

      // ✅ changed
      positionId: { type: "string", format: "uuid" },

      departmentId: { type: "number" },
      joiningDate: { type: "string", format: "date" },

      managerId: { type: ["string", "null"], format: "uuid" },
      systemId: { type: ["string", "null"], format: "uuid" },

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
        message: { type: "string" },
        employeeId: { type: "string" },
        userId: { type: "string" },
      },
      required: ["message", "employeeId", "userId"],
    },
    409: errorResponse,
    500: errorResponse,
  },
};


export const getEmployeesSchema = {
  tags: ["Employees"],
  querystring: {
    type: "object",
    properties: {
      search: { type: "string" },
      page: { type: "number", minimum: 1 },
      limit: { type: "number", minimum: 1, maximum: 100 },
      sortBy: {
        type: "string",
        enum: ["firstName", "createdAt"],
      },
      sortOrder: {
        type: "string",
        enum: ["asc", "desc"],
      },
    },
    additionalProperties: false,
  },
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
      id: { type: "string", format: "uuid" },
    },
  },

  body: {
    type: "object",
    properties: {
      firstName: { type: "string" },
      lastName: { type: "string" },

      // ✅ changed
      positionId: { type: "string", format: "uuid" },

      departmentId: { type: "number" },
      managerId: { type: ["string", "null"], format: "uuid" },
      systemId: { type: ["string", "null"], format: "uuid" },

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
        message: { type: "string" },
      },
      required: ["message"],
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
