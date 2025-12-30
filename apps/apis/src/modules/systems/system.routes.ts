import type { FastifyInstance } from "fastify";
import {
  createSystem,
  getSystems,
  getSystemById,
  updateSystem,
  deleteSystem,
} from "./system.service";

import type {
  CreateSystemDto,
  UpdateSystemDto,
} from "@shared/types/src/system/system.dto";

export default async function systemRoutes(app: FastifyInstance) {
  app.post("/systems", async (request, reply) => {
    const body = request.body as CreateSystemDto;

    const system = await createSystem(body);

    return reply.status(201).send(system);
  });

  app.get("/systems", async () => {
    return await getSystems();
  });

  app.get("/systems/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    const system = await getSystemById(id);
    if (!system) {
      return reply.status(404).send({ error: "System not found" });
    }

    return system;
  });

  app.put("/systems/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as UpdateSystemDto;

    const updated = await updateSystem(id, body);
    if (!updated) {
      return reply.status(404).send({ error: "System not found" });
    }

    return {
      message: "System updated successfully",
    };
  });

  app.delete("/systems/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    const deleted = await deleteSystem(id);
    if (!deleted) {
      return reply.status(404).send({ error: "System not found" });
    }

    return {
      message: "System deleted successfully",
    };
  });
}
