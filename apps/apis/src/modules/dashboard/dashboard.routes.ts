import type { FastifyInstance } from "fastify";
import {
  getDashboardSummaryHandler,
  getEmployeeDashboardHandler,
} from "./dashboard.service";
import { verifyAccessToken } from "../../middlewares/auth.middlewares";
import { authorize } from "../../middlewares/authorize.middleware";
import { PERMISSIONS } from "../../db/schema/permissions.enums";
import {
  getDashboardSummarySchema,
  getEmployeeDashboardSchema,
} from "./dashboard.schema";

export default async function dashboardRoutes(app: FastifyInstance) {
  const secured = {
    schema: {
      security: [{ bearerAuth: [] }],
    },
  };

  app.get(
    "/dashboard/summary",
    {
      ...secured,
      preHandler: [
        verifyAccessToken,
        authorize(PERMISSIONS.DASHBOARD_VIEW_ADMIN),
      ],
      schema: {
        ...secured.schema,
        ...getDashboardSummarySchema,
      },
    },
    getDashboardSummaryHandler,
  );

  app.get(
    "/employee/dashboard/summary",
    {
      ...secured,
      preHandler: [
        verifyAccessToken,
        authorize(PERMISSIONS.DASHBOARD_VIEW_EMPLOYEE),
      ],
      schema: {
        ...secured.schema,
        ...getEmployeeDashboardSchema,
      },
    },
    getEmployeeDashboardHandler,
  );
}
