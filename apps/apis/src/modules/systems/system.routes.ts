import type { FastifyInstance } from "fastify";

import {
  createSystem,
  getSystems,
  getSystemById,
  updateSystem,
  deleteSystem,
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
    createSystem
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
    getSystems
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
    getSystemById
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
    updateSystem
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
    deleteSystem
  );
}
