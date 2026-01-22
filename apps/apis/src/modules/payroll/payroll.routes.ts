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
import { authorize } from "../../middlewares/authorize.middleware";
import { PERMISSIONS } from "../../db/schema/permissions.enums";

export async function payrollRoutes(app: FastifyInstance) {
  app.post(
    "/payrolls/process",
    {
      schema: processPayrollSchema,
      preHandler: [verifyAccessToken, authorize(PERMISSIONS.PAYROLL_PROCESS)],
    },
    processPayrollHandler,
  );

  app.get(
    "/payrolls",
    {
      schema: getPayrollsSchema,
      preHandler: [verifyAccessToken, authorize(PERMISSIONS.PAYROLL_VIEW)],
    },
    getPayrollsHandler,
  );

  app.get(
    "/payrolls/:id",
    {
      schema: getPayrollByIdSchema,
      preHandler: [verifyAccessToken, authorize(PERMISSIONS.PAYROLL_VIEW)],
    },
    getPayrollByIdHandler,
  );

  app.patch(
    "/payrolls/:id",
    {
      schema: updatePayrollSchema,
      preHandler: [verifyAccessToken, authorize(PERMISSIONS.PAYROLL_UPDATE)],
    },
    updatePayrollHandler,
  );

  app.delete(
    "/payrolls/:id",
    {
      schema: deletePayrollSchema,
      preHandler: [verifyAccessToken, authorize(PERMISSIONS.PAYROLL_DELETE)],
    },
    deletePayrollHandler,
  );

  app.get(
    "/payrolls/summary",
    {
      schema: payrollSummarySchema,
      preHandler: [
        verifyAccessToken,
        authorize(PERMISSIONS.PAYROLL_VIEW_SUMMARY),
      ],
    },
    getPayrollSummaryHandler,
  );
}
