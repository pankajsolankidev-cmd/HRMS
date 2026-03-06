const errorResponse = {
  type: "object",
  properties: {
    message: { type: "string" },
  },
  required: ["message"],
};

export const createHolidaySchema = {
  tags: ["Holidays"],

  body: {
    type: "object",
    required: ["title", "fromDate", "toDate"],

    properties: {
      title: {
        type: "string",
        transform: ["trim"],
        minLength: 2,
      },

      fromDate: {
        type: "string",
        format: "date",
      },

      toDate: {
        type: "string",
        format: "date",
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

export const updateHolidaySchema = {
  tags: ["Holidays"],

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
      title: {
        type: "string",
        transform: ["trim"],
        minLength: 2,
      },

      fromDate: {
        type: "string",
        format: "date",
      },

      toDate: {
        type: "string",
        format: "date",
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

export const getHolidayByIdSchema = {
  tags: ["Holidays"],

  params: {
    type: "object",
    required: ["id"],

    properties: {
      id: { type: "string", format: "uuid" },
    },
  },
};

export const getHolidaysSchema = {
  tags: ["Holidays"],

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
        enum: ["title", "createdAt"],
      },

      sortOrder: {
        type: "string",
        enum: ["asc", "desc"],
      },
    },

    additionalProperties: false,
  },
};
