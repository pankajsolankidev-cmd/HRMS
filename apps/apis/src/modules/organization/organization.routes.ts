import type { FastifyInstance } from "fastify";
import {
  upsertOrganizationHandler,
  getOrganizationHandler,
} from "./organization.service";
import { verifyAccessToken } from "../../middlewares/auth.middlewares";
import { authorize } from "../../middlewares/authorize.middleware";
import { PERMISSIONS } from "../../db/schema/permissions.enums";
import {
  getOrganizationSchema,
  upsertOrganizationSchema,
} from "./organization.schema";

export default async function organizationRoutes(app: FastifyInstance) {
  const secured = {
    schema: {
      security: [{ bearerAuth: [] }],
      tags: ["Organization"],
    },
  };

  app.post(
    "/organization",
    {
      ...secured,
      preHandler: [
        verifyAccessToken,
        authorize(PERMISSIONS.ORGANIZATION_UPDATE),
      ],
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
      preHandler: [verifyAccessToken, authorize(PERMISSIONS.ORGANIZATION_VIEW)],
      schema: {
        ...secured.schema,
        ...getOrganizationSchema,
      },
    },
    getOrganizationHandler,
  );
}
