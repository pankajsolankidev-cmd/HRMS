const errorResponse = {
  type: "object",
  properties: {
    message: { type: "string" },
  },
  required: ["message"],
};

export const createDepartmentSchema = {
  tags: ["Departments"],

  body: {
    type: "object",
    required: ["name"],

    properties: {
      name: {
        type: "string",
        transform: ["trim"],
        minLength: 2,
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

export const updateDepartmentSchema = {
  tags: ["Departments"],

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
      name: {
        type: "string",
        transform: ["trim"],
        minLength: 2,
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
  },
};

export const getDepartmentByIdSchema = {
  tags: ["Departments"],

  params: {
    type: "object",
    required: ["id"],

    properties: {
      id: { type: "string", format: "uuid" },
    },
  },

  response: {
    200: {
      type: "object",

      properties: {
        id: { type: "string", format: "uuid" },
        name: { type: "string" },
        createdAt: { type: "string", format: "date-time" },
        updatedAt: { type: "string", format: "date-time" },
      },

      required: ["id", "name", "createdAt", "updatedAt"],
    },

    404: errorResponse,
  },
};

export const getDepartmentsSchema = {
  tags: ["Departments"],

  querystring: {
    type: "object",

    properties: {
      search: {
        type: "string",
        transform: ["trim"],
      },

      page: {
        type: "number",
        minimum: 1,
      },

      limit: {
        type: "number",
        minimum: 1,
        maximum: 100,
      },

      sortBy: {
        type: "string",
        enum: ["name", "createdAt"],
      },

      sortOrder: {
        type: "string",
        enum: ["asc", "desc"],
      },
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
              id: { type: "string", format: "uuid" },
              name: { type: "string" },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
            },

            required: ["id", "name", "createdAt", "updatedAt"],
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