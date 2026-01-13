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

import type {
  CreateSystemDto,
  UpdateSystemDto,
} from "@shared/types/src/system/system.dto";

import { verifyAccessToken } from "../../middlewares/auth.middlewares";
import { sendMessage } from "../../utils/api-response";

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
    async (request, reply) => {
      const body = request.body as CreateSystemDto;

      await createSystem(body);
      return sendMessage(reply, "System created successfully", 201);
    }
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
    async (request) => {
      return getSystems(request.query as any);
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
        return reply.code(404).send({ message: "System not found" });
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
        return reply.code(404).send({ message: "System not found" });
      }

      return sendMessage(reply, "System updated successfully");
    }
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
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const deleted = await deleteSystem(id);

      if (!deleted) {
        return reply.code(404).send({ message: "System not found" });
      }

      return sendMessage(reply, "System deleted successfully");
    }
  );
}
