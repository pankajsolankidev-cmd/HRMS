import type { FastifyInstance } from "fastify";

import {
  createComponentHandler,
  getComponentsHandler,
  getComponentByIdHandler,
  updateComponentHandler,
  deleteComponentHandler,
} from "./component.service";

import {
  createComponentSchema,
  updateComponentSchema,
  getComponentByIdSchema,
  getComponentsSchema,
} from "./component.schema";

import { verifyAccessToken } from "../../middlewares/auth.middlewares";
import { authorize } from "../../middlewares/authorize.middleware";
import { PERMISSIONS } from "../../db/schema/permissions.enums";

export default async function componentRoutes(app: FastifyInstance) {
  const secured = {
    preHandler: [verifyAccessToken],
    schema: {
      security: [{ bearerAuth: [] }],
    },
  };

  app.post(
    "/components",
    {
      ...secured,
      preHandler: [verifyAccessToken, authorize(PERMISSIONS.COMPONENT_CREATE)],
      schema: {
        ...secured.schema,
        ...createComponentSchema,
      },
    },
    createComponentHandler,
  );

  app.get(
    "/components",
    {
      ...secured,
      preHandler: [verifyAccessToken, authorize(PERMISSIONS.COMPONENT_VIEW)],
      schema: {
        ...secured.schema,
        ...getComponentsSchema,
      },
    },
    getComponentsHandler,
  );

  app.get(
    "/components/:id",
    {
      ...secured,
      preHandler: [verifyAccessToken, authorize(PERMISSIONS.COMPONENT_VIEW)],
      schema: {
        ...secured.schema,
        ...getComponentByIdSchema,
      },
    },
    getComponentByIdHandler,
  );

  app.put(
    "/components/:id",
    {
      ...secured,
      preHandler: [verifyAccessToken, authorize(PERMISSIONS.COMPONENT_UPDATE)],
      schema: {
        ...secured.schema,
        ...updateComponentSchema,
      },
    },
    updateComponentHandler,
  );

  app.delete(
    "/components/:id",
    {
      ...secured,
      preHandler: [verifyAccessToken, authorize(PERMISSIONS.COMPONENT_DELETE)],
      schema: {
        ...secured.schema,
        tags: ["Components"],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string" },
          },
        },
      },
    },
    deleteComponentHandler,
  );
}
