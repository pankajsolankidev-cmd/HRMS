import type { FastifyInstance } from "fastify";

import {
  getPayrollsHandler,
  deletePayrollHandler,
  getPayrollSummaryHandler,
  processBulkPayrollHandler,
  employeeBulkPayrollHandler,
} from "./payroll.service";

import {
  getPayrollsSchema,
  payrollSummarySchema,
  deletePayrollSchema,
  employeeBulkPayrollSchema,
  processBulkPayrollSchema,
} from "./payroll.schema";

import { verifyAccessToken } from "../../middlewares/auth.middlewares";
import { authorize } from "../../middlewares/authorize.middleware";
import { PERMISSIONS } from "../../db/schema/permissions.enums";

export async function payrollRoutes(app: FastifyInstance) {
  const secured = {
    schema: {
      security: [{ bearerAuth: [] }],
      tags: ["Payroll"],
    },
  };

  app.get(
    "/payrolls",
    {
      ...secured,
      schema: { ...secured.schema, ...getPayrollsSchema },
      preHandler: [verifyAccessToken],
    },
    getPayrollsHandler,
  );

  app.delete(
    "/payrolls/:id",
    {
      ...secured,
      schema: { ...secured.schema, ...deletePayrollSchema },
      preHandler: [verifyAccessToken, authorize(PERMISSIONS.PAYROLL_DELETE)],
    },
    deletePayrollHandler,
  );

  app.get(
    "/payrolls/summary",
    {
      ...secured,
      schema: { ...secured.schema, ...payrollSummarySchema },
      preHandler: [
        verifyAccessToken,
        authorize(PERMISSIONS.PAYROLL_VIEW_SUMMARY),
      ],
    },
    getPayrollSummaryHandler,
  );

  app.get(
    "/payrolls/bulk/employee",
    {
      ...secured,
      schema: { ...secured.schema, ...employeeBulkPayrollSchema },
      preHandler: [verifyAccessToken, authorize(PERMISSIONS.PAYROLL_PROCESS)],
    },
    employeeBulkPayrollHandler,
  );

  app.post(
    "/payrolls/bulk/process",
    {
      ...secured,
      schema: { ...secured.schema, ...processBulkPayrollSchema },
      preHandler: [verifyAccessToken, authorize(PERMISSIONS.PAYROLL_PROCESS)],
    },
    processBulkPayrollHandler,
  );
}
