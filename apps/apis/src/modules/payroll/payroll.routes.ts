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
import { authenticate } from "../../plugins/auth.plugin";

export async function payrollRoutes(app: FastifyInstance) {
  app.get(
    "/payrolls",
    {
      schema: getPayrollsSchema,
      preHandler: [authenticate],
    },
    getPayrollsHandler,
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

  app.get(
    "/payrolls/bulk/employee",
    {
      schema: employeeBulkPayrollSchema,
      preHandler: [verifyAccessToken, authorize(PERMISSIONS.PAYROLL_PROCESS)],
    },
    employeeBulkPayrollHandler,
  );

  app.post(
    "/payrolls/bulk/process",
    {
      schema: processBulkPayrollSchema,
      preHandler: [verifyAccessToken, authorize(PERMISSIONS.PAYROLL_PROCESS)],
    },
    processBulkPayrollHandler,
  );
}
