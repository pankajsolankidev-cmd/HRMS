import type { FastifyRequest, FastifyReply } from "fastify";
import { eq, inArray, ilike, asc, desc, and } from "drizzle-orm";

import { db } from "../../db";
import { systems } from "../../db/schema/systems.schema";
import { systemComponents } from "../../db/schema/system-components.schema";
import { components } from "../../db/schema/components.schema";
import { getPagination } from "../../utils/pagination";
import { sendMessage } from "../../utils/api-response";

import type {
  CreateSystemDto,
  UpdateSystemDto,
} from "@shared/types/src/system/system.dto";

export async function createSystemHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const body = request.body as CreateSystemDto;

  await db.transaction(async (tx) => {
    const [system] = await tx
      .insert(systems)
      .values({
        name: body.name,
        description: body.description,
      })
      .returning();

    if (body.componentIds?.length) {
      await tx.insert(systemComponents).values(
        body.componentIds.map((componentId) => ({
          systemId: system.id,
          componentId,
        }))
      );
    }
  });

  return sendMessage(reply, "System created successfully", 201);
}

export async function getSystemsHandler(request: FastifyRequest) {
  const query = request.query as {
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: "createdAt" | "name";
    sortOrder?: "asc" | "desc";
  };

  const { limit, offset, page } = getPagination(query || {});
  const sortBy = query?.sortBy ?? "createdAt";
  const sortOrder = query?.sortOrder ?? "desc";

  const conditions = [];

  if (query?.search) {
    conditions.push(ilike(systems.name, `%${query.search}%`));
  }

  const whereClause = conditions.length ? and(...conditions) : undefined;

  const orderBy =
    sortOrder === "asc" ? asc(systems[sortBy]) : desc(systems[sortBy]);

  const systemsList = await db
    .select()
    .from(systems)
    .where(whereClause)
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);

  if (!systemsList.length) {
    return { data: [], page, limit };
  }

  const systemIds = systemsList.map((s) => s.id);

  const rows = await db
    .select({
      systemId: systemComponents.systemId,
      component: components,
    })
    .from(systemComponents)
    .innerJoin(components, eq(systemComponents.componentId, components.id))
    .where(inArray(systemComponents.systemId, systemIds));

  return {
    data: systemsList.map((system) => ({
      ...system,
      components: rows
        .filter((r) => r.systemId === system.id)
        .map((r) => r.component),
    })),
    page,
    limit,
  };
}

export async function getSystemByIdHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { id } = request.params as { id: string };

  const [system] = await db.select().from(systems).where(eq(systems.id, id));

  if (!system) {
    return reply.code(404).send({ message: "System not found" });
  }

  const rows = await db
    .select({ component: components })
    .from(systemComponents)
    .innerJoin(components, eq(systemComponents.componentId, components.id))
    .where(eq(systemComponents.systemId, id));

  return {
    ...system,
    components: rows.map((r) => r.component),
  };
}

export async function updateSystemHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { id } = request.params as { id: string };
  const body = request.body as UpdateSystemDto;

  const updated = await db.transaction(async (tx) => {
    const [system] = await tx
      .update(systems)
      .set({
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && {
          description: body.description,
        }),
        updatedAt: new Date(),
      })
      .where(eq(systems.id, id))
      .returning();

    if (!system) return null;

    if (Array.isArray(body.componentIds)) {
      await tx
        .delete(systemComponents)
        .where(eq(systemComponents.systemId, id));

      if (body.componentIds.length) {
        await tx.insert(systemComponents).values(
          body.componentIds.map((componentId) => ({
            systemId: id,
            componentId,
          }))
        );
      }
    }

    return system;
  });

  if (!updated) {
    return reply.code(404).send({ message: "System not found" });
  }

  return sendMessage(reply, "System updated successfully");
}

export async function deleteSystemHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { id } = request.params as { id: string };

  const [deleted] = await db
    .delete(systems)
    .where(eq(systems.id, id))
    .returning();

  if (!deleted) {
    return reply.code(404).send({ message: "System not found" });
  }

  return sendMessage(reply, "System deleted successfully");
}
