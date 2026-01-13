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
      name: { type: "string" },
      description: { type: "string" },
      componentIds: {
        type: "array",
        items: { type: "string" },
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
      id: { type: "string" },
    },
  },
  body: {
    type: "object",
    properties: {
      name: { type: "string" },
      description: { type: "string" },
      componentIds: {
        type: "array",
        items: { type: "string" },
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
      id: { type: "string" },
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
      search: { type: "string" },
      page: { type: "number", minimum: 1 },
      limit: { type: "number", minimum: 1, maximum: 100 },
      sortBy: {
        type: "string",
        enum: ["createdAt", "name"],
      },
      sortOrder: {
        type: "string",
        enum: ["asc", "desc"],
      },
    },
    additionalProperties: false,
  },
};
