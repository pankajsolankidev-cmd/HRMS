const errorResponse = {
  type: "object",
  properties: {
    message: { type: "string" },
  },
  required: ["message"],
};

export const createProjectSchema = {
  tags: ["Projects"],

  body: {
    type: "object",
    required: ["name", "startDate"],

    properties: {
      name: {
        type: "string",
        transform: ["trim"],
        minLength: 2,
      },

      clientName: {
        type: "string",
        transform: ["trim"],
        minLength: 2,
      },

      startDate: {
        type: "string",
        format: "date",
      },

      expectedEndDate: {
        type: "string",
        format: "date",
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

export const updateProjectSchema = {
  tags: ["Projects"],

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

      clientName: {
        type: "string",
        transform: ["trim"],
        minLength: 2,
      },

      startDate: {
        type: "string",
        format: "date",
      },

      expectedEndDate: {
        type: "string",
        format: "date",
      },

      status: {
        type: "string",
        enum: ["ACTIVE", "COMPLETED"],
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

export const getProjectByIdSchema = {
  tags: ["Projects"],

  params: {
    type: "object",
    required: ["id"],

    properties: {
      id: { type: "string", format: "uuid" },
    },
  },
};

export const getProjectsSchema = {
  tags: ["Projects"],

  querystring: {
    type: "object",

    properties: {
      search: {
        type: "string",
        transform: ["trim"],
      },

      status: {
        type: "string",
        enum: ["ACTIVE", "COMPLETED"],
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
        enum: ["name", "startDate", "createdAt"],
      },

      sortOrder: {
        type: "string",
        enum: ["asc", "desc"],
      },
    },

    additionalProperties: false,
  },
};
