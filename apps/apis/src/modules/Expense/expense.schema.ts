const errorResponse = {
  type: "object",
  properties: {
    message: { type: "string" },
  },
  required: ["message"],
};

export const createExpenseSchema = {
  tags: ["Expenses"],

  body: {
    type: "object",
    required: ["expenseType", "amount", "expenseDate"],

    properties: {
      expenseType: {
        type: "string",
        transform: ["trim"],
        minLength: 1,
      },

      amount: {
        type: "number",
        minimum: 0.01,
      },

      expenseDate: {
        type: "string",
        format: "date",
      },

      description: {
        type: "string",
        transform: ["trim"],
      },

      file: {
        type: "string",
        transform: ["trim"],
        maxLength: 255,
      },
    },

    additionalProperties: false,
  },
};

export const updateExpenseSchema = {
  tags: ["Expenses"],

  params: {
    type: "object",
    required: ["id"],

    properties: {
      id: { type: "string", format: "uuid" },
    },
  },

  body: {
    type: "object",
    minProperties: 1,

    properties: {
      expenseType: {
        type: "string",
        transform: ["trim"],
        minLength: 1,
      },

      amount: {
        type: "number",
        minimum: 0.01,
      },

      expenseDate: {
        type: "string",
        format: "date",
      },

      description: {
        type: "string",
        transform: ["trim"],
      },

      file: {
        type: "string",
        transform: ["trim"],
        maxLength: 255,
      },
    },

    additionalProperties: false,
  },
};

export const getExpenseByIdSchema = {
  tags: ["Expenses"],

  params: {
    type: "object",
    required: ["id"],

    properties: {
      id: { type: "string", format: "uuid" },
    },
  },
};

export const getExpensesSchema = {
  tags: ["Expenses"],

  querystring: {
    type: "object",

    properties: {
      search: {
        type: "string",
        transform: ["trim"],
      },

      status: {
        type: "string",
        enum: ["DRAFT", "CREATED", "APPROVED", "REJECTED"],
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
        enum: ["expenseDate", "createdAt", "amount"],
      },

      sortOrder: {
        type: "string",
        enum: ["asc", "desc"],
      },
    },

    additionalProperties: false,
  },
};

export const getExpenseSummarySchema = {
  tags: ["Expenses"],

  querystring: {
    type: "object",
    required: ["fromDate", "toDate"],

    properties: {
      fromDate: {
        type: "string",
        format: "date",
      },

      toDate: {
        type: "string",
        format: "date",
      },
    },

    additionalProperties: false,
  },

  response: {
    200: {
      type: "object",

      properties: {
        fromDate: { type: "string", format: "date" },
        toDate: { type: "string", format: "date" },
        totalAmount: { type: "string" },
        totalExpenses: { type: "number" },
      },

      required: ["fromDate", "toDate", "totalAmount", "totalExpenses"],
    },
  },
};
