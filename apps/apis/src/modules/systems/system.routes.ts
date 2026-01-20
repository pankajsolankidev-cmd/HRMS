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

export default async function systemRoutes(app: FastifyInstance) {
  const secured = {
    preHandler: verifyAccessToken,
    schema: {
      security: [{ bearerAuth: [] }],
      tags: ["Systems"],
    },
  };

  app.post(
    "/systems",
    {
      ...secured,
      schema: {
        ...secured.schema,
        ...createSystemSchema,
      },
    },
    createSystemHandler
  );

  app.get(
    "/systems",
    {
      ...secured,
      schema: {
        ...secured.schema,
        ...getSystemsSchema,
      },
    },
    getSystemsHandler
  );

  app.get(
    "/systems/:id",
    {
      ...secured,
      schema: {
        ...secured.schema,
        ...getSystemByIdSchema,
      },
    },
    getSystemByIdHandler
  );

  app.put(
    "/systems/:id",
    {
      ...secured,
      schema: {
        ...secured.schema,
        ...updateSystemSchema,
      },
    },
    updateSystemHandler
  );

  app.delete(
    "/systems/:id",
    {
      ...secured,
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
    deleteSystemHandler
  );
}
