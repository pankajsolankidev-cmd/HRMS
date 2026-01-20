import type { FastifyInstance } from "fastify";

import { verifyAccessToken } from "../../middlewares/auth.middlewares";
import {
  createExpenseSchema,
  getExpenseByIdSchema,
  getExpensesSchema,
  updateExpenseSchema,
} from "./expense.schema";
import {
  createExpenseHandler,
  deleteExpenseHandler,
  getExpenseByIdHandler,
  getExpensesHandler,
  getExpenseSummaryHandler,
  updateExpenseHandler,
} from "./expense.service";

export default async function expenseRoutes(app: FastifyInstance) {
  const secured = {
    preHandler: verifyAccessToken,
    schema: {
      security: [{ bearerAuth: [] }],
    },
  };

  app.post(
    "/expenses",
    {
      ...secured,
      schema: {
        ...secured.schema,
        ...createExpenseSchema,
      },
    },
    createExpenseHandler
  );

  app.get(
    "/expenses/summary",
    {
      ...secured,
      schema: {
        ...secured.schema,
        tags: ["Expenses"],
      },
    },
    getExpenseSummaryHandler
  );

  app.get(
    "/expenses",
    {
      ...secured,
      schema: {
        ...secured.schema,
        ...getExpensesSchema,
      },
    },
    getExpensesHandler
  );

  app.get(
    "/expenses/:id",
    {
      ...secured,
      schema: {
        ...secured.schema,
        ...getExpenseByIdSchema,
      },
    },
    getExpenseByIdHandler
  );

  app.put(
    "/expenses/:id",
    {
      ...secured,
      schema: {
        ...secured.schema,
        ...updateExpenseSchema,
      },
    },
    updateExpenseHandler
  );

  app.delete(
    "/expenses/:id",
    {
      ...secured,
      schema: {
        ...secured.schema,
        tags: ["Expenses"],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string" },
          },
        },
      },
    },
    deleteExpenseHandler
  );
}
