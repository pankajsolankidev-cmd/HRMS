const messageResponse = {
  type: "object",
  required: ["message"],
  properties: {
    message: { type: "string" },
  },
};

export const createSystemSchema = {
  tags: ["Systems"],

  body: {
    type: "object",
    required: ["name"],

    properties: {
      name: {
        type: "string",
        transform: ["trim"],
        minLength: 2,
      },

      description: {
        type: "string",
        transform: ["trim"],
      },

      componentIds: {
        type: "array",

        items: {
          type: "string",
          format: "uuid",
        },
      },
    },

    additionalProperties: false,
  },

  response: {
    201: messageResponse,
    500: messageResponse,
  },
};

export const updateSystemSchema = {
  tags: ["Systems"],

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

      description: {
        type: "string",
        transform: ["trim"],
      },

      componentIds: {
        type: "array",

        items: {
          type: "string",
          format: "uuid",
        },
      },
    },

    additionalProperties: false,
  },

  response: {
    200: messageResponse,
    404: messageResponse,
    500: messageResponse,
  },
};

export const getSystemByIdSchema = {
  tags: ["Systems"],

  params: {
    type: "object",
    required: ["id"],

    properties: {
      id: { type: "string", format: "uuid" },
    },
  },

  response: {
    404: messageResponse,
  },
};

export const getSystemsSchema = {
  tags: ["Systems"],

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
        enum: ["createdAt", "name"],
      },

      sortOrder: {
        type: "string",
        enum: ["asc", "desc"],
      },
      excludeAssigned: {
        type: "boolean",
      },
    },

    additionalProperties: false,
  },
};
