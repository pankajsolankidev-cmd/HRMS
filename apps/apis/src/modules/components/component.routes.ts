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

import type { CreateComponentDto } from "@shared/types/src/components/create-component.dto";
import type { UpdateComponentDto } from "@shared/types/src/components/update-component.dto";

import { verifyAccessToken } from "../../middlewares/auth.middlewares";
import { sendMessage } from "../../utils/api-response";

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
    async (request, reply) => {
      const body = request.body as CreateComponentDto;
      await createComponent(body);

      return sendMessage(reply, "Component created successfully", 201);
    }
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
    async (request) => {
      const query = request.query as {
        search?: string;
        page?: number;
        limit?: number;
        sortBy?: "name" | "createdAt";
        sortOrder?: "asc" | "desc";
      };

      return getComponents(query);
    }
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
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const component = await getComponentById(id);

      if (!component) {
        return reply.status(404).send({ message: "Component not found" });
      }

      return component;
    }
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
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = request.body as UpdateComponentDto;

      const updated = await updateComponent(id, body);
      if (!updated) {
        return reply.status(404).send({ message: "Component not found" });
      }

      return sendMessage(reply, "Component updated successfully");
    }
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
    async (request, reply) => {
      const { id } = request.params as { id: string };
      await deleteComponent(id);

      return sendMessage(reply, "Component deleted successfully");
    }
  );
}
