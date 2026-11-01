const errorResponse = {
  type: "object",
  properties: {
    message: { type: "string" },
  },
  required: ["message"],
};

export const createComponentSchema = {
  tags: ["Components"],

  body: {
    type: "object",
    required: ["name"],

    properties: {
      name: {
        type: "string",
        transform: ["trim"],
        minLength: 1,
      },

      code: {
        type: "string",
        transform: ["trim"],
        minLength: 1,
      },

      description: {
        type: "string",
        transform: ["trim"],
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

export const updateComponentSchema = {
  tags: ["Components"],

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
        minLength: 1,
      },

      code: {
        type: "string",
        transform: ["trim"],
        minLength: 1,
      },

      description: {
        type: "string",
        transform: ["trim"],
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

export const getComponentByIdSchema = {
  tags: ["Components"],

  params: {
    type: "object",
    required: ["id"],

    properties: {
      id: { type: "string", format: "uuid" },
    },
  },
};

export const getComponentsSchema = {
  tags: ["Components"],

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
      excludeAssigned: {
        type: "boolean",
      },
    },

    additionalProperties: false,
  },
};