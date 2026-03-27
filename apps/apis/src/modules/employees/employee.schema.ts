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
      firstName: {
        type: "string",
        transform: ["trim"],
        minLength: 1,
      },

      lastName: {
        type: "string",
        transform: ["trim"],
        minLength: 1,
      },

      email: {
        type: "string",
        format: "email",
        transform: ["trim"],
      },

      positionId: {
        type: "string",
        format: "uuid",
      },

      departmentId: {
        type: ["string", "null"],
        format: "uuid",
      },

      joiningDate: {
        type: "string",
        format: "date",
      },

      managerId: {
        type: ["string", "null"],
        format: "uuid",
      },

      systemId: {
        type: ["string", "null"],
        format: "uuid",
      },

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
        employeeId: { type: "string", format: "uuid" },
        userId: { type: "string", format: "uuid" },
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
      excludeAdmin: { type: "boolean" },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      type: "object",
      properties: {
        data: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              firstName: { type: "string" },
              lastName: { type: "string" },
              email: { type: "string" },
              joiningDate: { type: ["string", "null"] },
              userId: { type: ["string", "null"] },

              welcome: {
                type: "object",
                properties: {
                  welcomewithWhatsapp: { type: "boolean" },
                  welcomewithGmail: { type: "boolean" },
                  welcomewithSlack: { type: "boolean" },
                },
                required: [
                  "welcomewithWhatsapp",
                  "welcomewithGmail",
                  "welcomewithSlack",
                ],
              },

              documents: {
                type: ["object", "null"],
                properties: {
                  generateOfferLetter: { type: "boolean" },
                  generateAppointmentLetter: { type: "boolean" },
                },
              },

              position: {
                type: ["object", "null"],
                properties: {
                  id: { type: "string" },
                  name: { type: "string" },
                },
              },

              department: {
                type: ["object", "null"],
                properties: {
                  id: { type: "string" },
                  name: { type: "string" },
                },
              },

              manager: {
                type: ["object", "null"],
                properties: {
                  id: { type: "string" },
                  firstName: { type: "string" },
                  lastName: { type: "string" },
                  email: { type: "string" },
                },
              },

              system: {
                type: ["object", "null"],
                properties: {
                  id: { type: "string" },
                  name: { type: "string" },
                  description: { type: ["string", "null"] },
                  components: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        name: { type: "string" },
                        description: { type: ["string", "null"] },
                        code: { type: ["string", "null"] },
                      },
                      required: ["id", "name"],
                    },
                  },
                },
              },
            },
            required: ["id", "firstName", "lastName", "email", "welcome"],
          },
        },
        meta: {
          type: "object",
          properties: {
            page: { type: "number" },
            limit: { type: ["number", "null"] },
            total: { type: "number" },
          },
          required: ["page", "limit", "total"],
        },
      },
      required: ["data", "meta"],
    },
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
    200: {
      type: "object",
      properties: {
        id: { type: "string" },
        firstName: { type: "string" },
        lastName: { type: "string" },
        email: { type: "string" },
        joiningDate: { type: ["string", "null"] },
        userId: { type: ["string", "null"] },

        welcome: {
          type: "object",
          properties: {
            welcomewithWhatsapp: { type: "boolean" },
            welcomewithGmail: { type: "boolean" },
            welcomewithSlack: { type: "boolean" },
          },
          required: [
            "welcomewithWhatsapp",
            "welcomewithGmail",
            "welcomewithSlack",
          ],
        },

        documents: {
          type: ["object", "null"],
          properties: {
            generateOfferLetter: { type: "boolean" },
            generateAppointmentLetter: { type: "boolean" },
          },
        },

        position: {
          type: ["object", "null"],
          properties: {
            id: { type: "string" },
            name: { type: "string" },
          },
        },

        department: {
          type: ["object", "null"],
          properties: {
            id: { type: "string" },
            name: { type: "string" },
          },
        },

        manager: {
          type: ["object", "null"],
          properties: {
            id: { type: "string" },
            firstName: { type: "string" },
            lastName: { type: "string" },
            email: { type: "string" },
          },
        },

        system: {
          type: ["object", "null"],
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            description: { type: ["string", "null"] },
            components: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  name: { type: "string" },
                  description: { type: ["string", "null"] },
                  code: { type: ["string", "null"] },
                },
                required: ["id", "name"],
              },
            },
          },
        },
      },
      required: ["id", "firstName", "lastName", "email", "welcome"],
    },

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
      firstName: {
        type: "string",
        transform: ["trim"],
        minLength: 1,
      },

      lastName: {
        type: "string",
        transform: ["trim"],
        minLength: 1,
      },

      positionId: {
        type: "string",
        format: "uuid",
      },

      departmentId: {
        type: ["string", "null"],
        format: "uuid",
      },

      managerId: {
        type: ["string", "null"],
        format: "uuid",
      },

      systemId: {
        type: ["string", "null"],
        format: "uuid",
      },

      joiningDate: {
        type: "string",
        format: "date",
      },

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
