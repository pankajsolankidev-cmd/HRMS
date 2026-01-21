export const createExpenseSchema = {
  tags: ["Expenses"],
  body: {
    type: "object",
    required: ["expenseType", "amount", "expenseDate"],
    properties: {
      expenseType: { type: "string" },
      amount: { type: "number", minimum: 0.01 },
      expenseDate: { type: "string", format: "date" },
      description: { type: "string" },
      file: { type: "string" },
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
      id: { type: "string" },
    },
  },
  body: {
    type: "object",
    properties: {
      expenseType: { type: "string" },
      amount: { type: "number", minimum: 0.01 },
      expenseDate: { type: "string", format: "date" },
      description: { type: "string" },
      file: { type: "string" },
      status: {
        type: "string",
        enum: ["DRAFT", "SUBMITTED"],
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
      id: { type: "string" },
    },
  },
};

export const getExpensesSchema = {
  tags: ["Expenses"],
  querystring: {
    type: "object",
    properties: {
      search: { type: "string" },
      status: {
        type: "string",
        enum: ["DRAFT", "SUBMITTED", "APPROVED", "REJECTED"],
      },
      page: { type: "number", minimum: 1 },
      limit: { type: "number", minimum: 1, maximum: 100 },
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
    required: ["month", "year"],
    properties: {
      month: {
        type: "number",
        minimum: 1,
        maximum: 12,
      },
      year: {
        type: "number",
        minimum: 2000,
      },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      type: "object",
      properties: {
        month: { type: "number" },
        year: { type: "number" },
        totalAmount: { type: "string" },
        totalExpenses: { type: "number" },
      },
      required: ["month", "year", "totalAmount", "totalExpenses"],
    },
  },
};
