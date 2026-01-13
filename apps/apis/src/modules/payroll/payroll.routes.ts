import type { FastifyInstance } from "fastify";

import {
  processPayrollHandler,
  getPayrollsHandler,
  getPayrollByIdHandler,
  updatePayrollHandler,
  deletePayrollHandler,
  getPayrollSummaryHandler,
} from "./payroll.service";

import {
  processPayrollSchema,
  getPayrollsSchema,
  getPayrollByIdSchema,
  payrollSummarySchema,
  updatePayrollSchema,
  deletePayrollSchema,
} from "./payroll.schema";

import { verifyAccessToken } from "../../middlewares/auth.middlewares";

export async function payrollRoutes(app: FastifyInstance) {
  app.post(
    "/payrolls/process",
    {
      schema: processPayrollSchema,
      preHandler: verifyAccessToken,
    },
    processPayrollHandler
  );

  app.get(
    "/payrolls",
    {
      schema: getPayrollsSchema,
      preHandler: verifyAccessToken,
    },
    getPayrollsHandler
  );

  app.get(
    "/payrolls/:id",
    {
      schema: getPayrollByIdSchema,
      preHandler: verifyAccessToken,
    },
    getPayrollByIdHandler
  );

  app.patch(
    "/payrolls/:id",
    {
      schema: updatePayrollSchema,
      preHandler: verifyAccessToken,
    },
    updatePayrollHandler
  );

  app.delete(
    "/payrolls/:id",
    {
      schema: deletePayrollSchema,
      preHandler: verifyAccessToken,
    },
    deletePayrollHandler
  );

  app.get(
    "/payrolls/summary",
    {
      schema: payrollSummarySchema,
      preHandler: verifyAccessToken,
    },
    getPayrollSummaryHandler
  );
}
