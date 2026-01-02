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
