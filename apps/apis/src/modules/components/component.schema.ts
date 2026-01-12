export const createComponentSchema = {
  tags: ["Components"],
  body: {
    type: "object",
    required: ["name", "code"],
    properties: {
      name: { type: "string" },
      description: { type: "string" },
      code: { type: "string" },
    },
  },
  response: {
    201: {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        description: { type: "string" },
        code: { type: "string" },
        createdAt: { type: "string" },
        updatedAt: { type: "string" },
      },
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
