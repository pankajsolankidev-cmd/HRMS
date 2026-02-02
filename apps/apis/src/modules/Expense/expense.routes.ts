import type { FastifyInstance } from "fastify";

import {
  createExpenseSchema,
  getExpenseByIdSchema,
  getExpensesSchema,
  updateExpenseSchema,
  getExpenseSummarySchema,
} from "./expense.schema";

import { verifyAccessToken } from "../../middlewares/auth.middlewares";
import { authorize } from "../../middlewares/authorize.middleware";

import {
  createExpenseHandler,
  deleteExpenseHandler,
  getExpenseByIdHandler,
  getExpensesHandler,
  getExpenseSummaryHandler,
  updateExpenseHandler,
  createExpenseRequestHandler,
  approveExpenseHandler,
  rejectExpenseHandler,
} from "./expense.service";

import { PERMISSIONS } from "../../db/schema/permissions.enums";

export default async function expenseRoutes(app: FastifyInstance) {
  const secured = {
    preHandler: [verifyAccessToken],
    schema: {
      security: [{ bearerAuth: [] }],
      tags: ["Expenses"],
    },
  };

  app.post(
    "/expenses",
    {
      ...secured,
      preHandler: [verifyAccessToken, authorize(PERMISSIONS.EXPENSE_CREATE)],
      schema: {
        ...secured.schema,
        ...createExpenseSchema,
      },
    },
    createExpenseHandler,
  );

  app.get(
    "/expenses/summary",
    {
      ...secured,
      preHandler: [verifyAccessToken],
      schema: {
        ...secured.schema,
        ...getExpenseSummarySchema,
      },
    },
    getExpenseSummaryHandler,
  );

  app.get(
    "/expenses",
    {
      ...secured,
      preHandler: [verifyAccessToken],
      schema: {
        ...secured.schema,
        ...getExpensesSchema,
      },
    },
    getExpensesHandler,
  );

  app.get(
    "/expenses/:id",
    {
      ...secured,
      preHandler: [verifyAccessToken],
      schema: {
        ...secured.schema,
        ...getExpenseByIdSchema,
      },
    },
    getExpenseByIdHandler,
  );

  app.put(
    "/expenses/:id",
    {
      ...secured,
      preHandler: [
        verifyAccessToken
       
      ],
      schema: {
        ...secured.schema,
        ...updateExpenseSchema,
      },
    },
    updateExpenseHandler,
  );

  app.delete(
    "/expenses/:id",
    {
      ...secured,
      preHandler: [
        verifyAccessToken,
        
      ],
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
    deleteExpenseHandler,
  );

  app.patch(
    "/expenses/:id/create",
    {
      ...secured,
      preHandler: [verifyAccessToken, authorize(PERMISSIONS.EXPENSE_SUBMIT)],
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
    createExpenseRequestHandler,
  );

  app.patch(
    "/expenses/:id/approve",
    {
      ...secured,
      preHandler: [verifyAccessToken, authorize(PERMISSIONS.EXPENSE_APPROVE)],
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
    approveExpenseHandler,
  );

  app.patch(
    "/expenses/:id/reject",
    {
      ...secured,
      preHandler: [verifyAccessToken, authorize(PERMISSIONS.EXPENSE_APPROVE)],
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
        body: {
          type: "object",
          required: ["reason"],
          properties: {
            reason: { type: "string", minLength: 1 },
          },
          additionalProperties: false,
        },
      },
    },
    rejectExpenseHandler,
  );
}
