import type { FastifyRequest, FastifyReply } from "fastify";
import { and, eq, ilike, asc, desc, sql } from "drizzle-orm";

import { db } from "../../db";
import { components } from "../../db/schema/components.schema";

import type { CreateComponentDto } from "@shared/types/src/components/create-component.dto";
import type { UpdateComponentDto } from "@shared/types/src/components/update-component.dto";

import { sendMessage } from "../../utils/api-response";

export async function createComponent(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const body = request.body as CreateComponentDto;

  await db.insert(components).values(body);

  return sendMessage(reply, "Component created successfully", 201);
}

export async function getComponents(request: FastifyRequest) {
  const query = request.query as {
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: "name" | "createdAt";
    sortOrder?: "asc" | "desc";
  };

  const conditions = [];

  if (query?.search) {
    conditions.push(ilike(components.name, `%${query.search}%`));
  }

  const page = Math.max(1, Number(query?.page) || 1);
  const limit = Math.min(100, Number(query?.limit) || 10);
  const offset = (page - 1) * limit;

  const sortColumn =
    query?.sortBy === "createdAt" ? components.createdAt : components.name;

  const order = query?.sortOrder === "asc" ? asc(sortColumn) : desc(sortColumn);

  const data = await db
    .select()
    .from(components)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(order)
    .limit(limit)
    .offset(offset);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(components)
    .where(conditions.length ? and(...conditions) : undefined);

  return {
    data,
    meta: {
      page,
      limit,
      total: Number(count),
    },
  };
}

export async function getComponentById(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { id } = request.params as { id: string };

  const [component] = await db
    .select()
    .from(components)
    .where(eq(components.id, id));

  if (!component) {
    return reply.status(404).send({ message: "Component not found" });
  }

  return component;
}

export async function updateComponent(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { id } = request.params as { id: string };
  const body = request.body as UpdateComponentDto;

  const [updated] = await db
    .update(components)
    .set({
      ...body,
      updatedAt: new Date(),
    })
    .where(eq(components.id, id))
    .returning();

  if (!updated) {
    return reply.status(404).send({ message: "Component not found" });
  }

  return sendMessage(reply, "Component updated successfully");
}

export async function deleteComponent(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { id } = request.params as { id: string };

  await db.delete(components).where(eq(components.id, id));

  return sendMessage(reply, "Component deleted successfully");
}
