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
} from "./system.schema";

import type {
  CreateSystemDto,
  UpdateSystemDto,
} from "@shared/types/src/system/system.dto";

import { verifyAccessToken } from "../../middlewares/auth.middlewares";

export default async function systemRoutes(app: FastifyInstance) {
  const secured = {
    preHandler: verifyAccessToken,
    schema: {
      security: [{ bearerAuth: [] }],
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
    async (request, reply) => {
      const body = request.body as CreateSystemDto;
      const system = await createSystem(body);
      return reply.status(201).send(system);
    }
  );

  app.get(
    "/systems",
    {
      ...secured,
      schema: {
        ...secured.schema,
        tags: ["Systems"],
      },
    },
    async () => {
      return await getSystems();
    }
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
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const system = await getSystemById(id);

      if (!system) {
        return reply.status(404).send({ error: "System not found" });
      }

      return system;
    }
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
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = request.body as UpdateSystemDto;

      const updated = await updateSystem(id, body);
      if (!updated) {
        return reply.status(404).send({ error: "System not found" });
      }

      return {
        message: "System updated successfully",
      };
    }
  );

  app.delete(
    "/systems/:id",
    {
      ...secured,
      schema: {
        ...secured.schema,
        tags: ["Systems"],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      const deleted = await deleteSystem(id);
      if (!deleted) {
        return reply.status(404).send({ error: "System not found" });
      }

      return {
        message: "System deleted successfully",
      };
    }
  );
}
