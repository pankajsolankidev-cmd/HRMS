import type { FastifyInstance } from "fastify";

import {
  createComponent,
  getComponents,
  getComponentById,
  updateComponent,
  deleteComponent,
} from "./component.service";

import {
  createComponentSchema,
  updateComponentSchema,
  getComponentByIdSchema,
  getComponentsSchema,
} from "./component.schema";

import { verifyAccessToken } from "../../middlewares/auth.middlewares";

export default async function componentRoutes(app: FastifyInstance) {
  const secured = {
    preHandler: verifyAccessToken,
    schema: {
      security: [{ bearerAuth: [] }],
    },
  };

  app.post(
    "/components",
    {
      ...secured,
      schema: {
        ...secured.schema,
        ...createComponentSchema,
      },
    },
    createComponent
  );

  app.get(
    "/components",
    {
      ...secured,
      schema: {
        ...secured.schema,
        ...getComponentsSchema,
      },
    },
    getComponents
  );

  app.get(
    "/components/:id",
    {
      ...secured,
      schema: {
        ...secured.schema,
        ...getComponentByIdSchema,
      },
    },
    getComponentById
  );

  app.put(
    "/components/:id",
    {
      ...secured,
      schema: {
        ...secured.schema,
        ...updateComponentSchema,
      },
    },
    updateComponent
  );

  app.delete(
    "/components/:id",
    {
      ...secured,
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
    deleteComponent
  );
}
