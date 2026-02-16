import type { FastifyInstance } from "fastify";
import {
  upsertOrganizationHandler,
  getOrganizationHandler,
} from "./organization.service";
import { verifyAccessToken } from "../../middlewares/auth.middlewares";
import {
  getOrganizationSchema,
  upsertOrganizationSchema,
} from "./organization.schema";

export default async function organizationRoutes(app: FastifyInstance) {
  const secured = {
    preHandler: [verifyAccessToken],
    schema: {
      security: [{ bearerAuth: [] }],
    },
  };

  app.post(
    "/organization",
    {
      ...secured,
      schema: {
        ...secured.schema,
        ...upsertOrganizationSchema,
      },
    },
    upsertOrganizationHandler,
  );

  app.get(
    "/organization",
    {
      ...secured,
      schema: {
        ...secured.schema,
        ...getOrganizationSchema,
      },
    },
    getOrganizationHandler,
  );
}
