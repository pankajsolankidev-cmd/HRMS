import type { FastifyInstance } from "fastify";

import {
  processPayroll,
  getPayrolls,
  getPayrollById,
  updatePayroll,
  deletePayroll,
  getPayrollSummary,
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
    processPayroll
  );

  app.get(
    "/payrolls",
    {
      schema: getPayrollsSchema,
      preHandler: verifyAccessToken,
    },
    getPayrolls
  );

  app.get(
    "/payrolls/:id",
    {
      schema: getPayrollByIdSchema,
      preHandler: verifyAccessToken,
    },
    getPayrollById
  );

  app.patch(
    "/payrolls/:id",
    {
      schema: updatePayrollSchema,
      preHandler: verifyAccessToken,
    },
    updatePayroll
  );

  app.delete(
    "/payrolls/:id",
    {
      schema: deletePayrollSchema,
      preHandler: verifyAccessToken,
    },
    deletePayroll
  );

  app.get(
    "/payrolls/summary",
    {
      schema: payrollSummarySchema,
      preHandler: verifyAccessToken,
    },
    getPayrollSummary
  );
}
