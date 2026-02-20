import type { FastifyInstance } from "fastify";
import { getDashboardSummaryHandler } from "./dashboard.service";
import { verifyAccessToken } from "../../middlewares/auth.middlewares";
import { getDashboardSummarySchema } from "./dashboard.schema";

export default async function dashboardRoutes(app: FastifyInstance) {
  const secured = {
    preHandler: [verifyAccessToken],
    schema: {
      security: [{ bearerAuth: [] }],
    },
  };

  app.get(
    "/dashboard/summary",
    {
      ...secured,
      schema: {
        ...secured.schema,
        ...getDashboardSummarySchema,
      },
    },
    getDashboardSummaryHandler,
  );
}
