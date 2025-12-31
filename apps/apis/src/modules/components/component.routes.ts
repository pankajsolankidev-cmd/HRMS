import type { FastifyInstance } from "fastify";

import {
  createComponent,
  getComponents,
  getComponentById,
  updateComponent,
  deleteComponent,
} from "./component.service";

import type { CreateComponentDto } from "@shared/types/src/components/create-component.dto";
import type { UpdateComponentDto } from "@shared/types/src/components/update-component.dto";

import { verifyAccessToken } from "../../middlewares/auth.middlewares";

export default async function componentRoutes(app: FastifyInstance) {
  const secured = {
    preHandler: verifyAccessToken,
    schema: {
      security: [{ bearerAuth: [] }],
    },
  };
  app.post("/components", secured, async (request, reply) => {
    const body = request.body as CreateComponentDto;
    const component = await createComponent(body);
    return reply.status(201).send(component);
  });

  app.get("/components", secured, async (_request, reply) => {
    return reply.send(await getComponents());
  });

  app.get("/components/:id", secured, async (request, reply) => {
    const { id } = request.params as { id: string };
    const component = await getComponentById(id);
    if (!component) {
      return reply.status(404).send({ error: "Component not found" });
    }
    return reply.send(component);
  });

  app.put("/components/:id", secured, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as UpdateComponentDto;
    const updated = await updateComponent(id, body);
    if (!updated) {
      return reply.status(404).send({ error: "Component not found" });
    }
    return reply.send(updated);
  });

  app.delete("/components/:id", secured, async (request, reply) => {
    const { id } = request.params as { id: string };
    await deleteComponent(id);
    return reply.send({ message: "Component deleted successfully" });
  });
}
