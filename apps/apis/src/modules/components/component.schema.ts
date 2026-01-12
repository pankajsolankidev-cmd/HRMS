export const createComponentSchema = {
  tags: ["Components"],
  body: {
    type: "object",
    required: ["name"],
    properties: {
      name: { type: "string" },
      description: { type: "string" },
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
      id: { type: "string" },
    },
  },
  body: {
    type: "object",
    properties: {
      name: { type: "string" },
      description: { type: "string" },
      code: { type: "string" },
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
    404: {
      type: "object",
      properties: {
        message: { type: "string" },
      },
      required: ["message"],
    },
  },
};

export const getComponentByIdSchema = {
  tags: ["Components"],
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string" },
    },
  },
};

export const getComponentsSchema = {
  tags: ["Components"],
  querystring: {
    type: "object",
    properties: {
      search: { type: "string" },
      page: { type: "number", minimum: 1 },
      limit: { type: "number", minimum: 1, maximum: 100 },
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
};
