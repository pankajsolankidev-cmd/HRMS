import type { FastifyInstance } from "fastify";

import {
  createSystemHandler,
  getSystemsHandler,
  getSystemByIdHandler,
  updateSystemHandler,
  deleteSystemHandler,
} from "./system.service";

import {
  createSystemSchema,
  updateSystemSchema,
  getSystemByIdSchema,
  getSystemsSchema,
} from "./system.schema";

import { verifyAccessToken } from "../../middlewares/auth.middlewares";
import { authorize } from "../../middlewares/authorize.middleware";
import { PERMISSIONS } from "../../db/schema/permissions.enums";

export default async function systemRoutes(app: FastifyInstance) {
  const secured = {
    preHandler: [verifyAccessToken],
    schema: {
      security: [{ bearerAuth: [] }],
      tags: ["Systems"],
    },
  };

  app.post(
    "/systems",
    {
      ...secured,
      preHandler: [verifyAccessToken, authorize(PERMISSIONS.SYSTEM_CREATE)],
      schema: {
        ...secured.schema,
        ...createSystemSchema,
      },
    },
    createSystemHandler,
  );

  app.get(
    "/systems",
    {
      ...secured,
      preHandler: [verifyAccessToken, authorize(PERMISSIONS.SYSTEM_VIEW)],
      schema: {
        ...secured.schema,
        ...getSystemsSchema,
      },
    },
    getSystemsHandler,
  );

  app.get(
    "/systems/:id",
    {
      ...secured,
      preHandler: [verifyAccessToken, authorize(PERMISSIONS.SYSTEM_VIEW)],
      schema: {
        ...secured.schema,
        ...getSystemByIdSchema,
      },
    },
    getSystemByIdHandler,
  );

  app.put(
    "/systems/:id",
    {
      ...secured,
      preHandler: [verifyAccessToken, authorize(PERMISSIONS.SYSTEM_UPDATE)],
      schema: {
        ...secured.schema,
        ...updateSystemSchema,
      },
    },
    updateSystemHandler,
  );

  app.delete(
    "/systems/:id",
    {
      ...secured,
      preHandler: [verifyAccessToken, authorize(PERMISSIONS.SYSTEM_DELETE)],
      schema: {
        ...secured.schema,
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string" },
          },
        },
      },
    },
    deleteSystemHandler,
  );
}
